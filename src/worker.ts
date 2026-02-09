/**
 * Cloudflare Worker entrypoint for GitPulse.
 *
 * Handles GitHub OAuth flow:
 *   GET /auth/login    — Redirects to GitHub authorization page
 *   GET /auth/callback — Exchanges code for access token, redirects to SPA
 *
 * All other requests are served from the static SPA assets.
 */

interface Env {
  ASSETS: Fetcher;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const OAUTH_SCOPES = "public_repo read:user";
const STATE_COOKIE = "gitpulse_oauth_state";

/**
 * Generate a cryptographically random string for the OAuth `state` parameter.
 */
function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse cookies from a request header into a key-value map.
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  }
  return cookies;
}

/**
 * Build the origin URL from the request (handles both dev and production).
 */
function getOrigin(request: Request): string {
  const url = new URL(request.url);
  return url.origin;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ---------------------
    // GET /auth/login
    // ---------------------
    if (url.pathname === "/auth/login") {
      const state = generateState();
      const origin = getOrigin(request);
      const redirectUri = `${origin}/auth/callback`;

      const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
      authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("scope", OAUTH_SCOPES);
      authorizeUrl.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: authorizeUrl.toString(),
          "Set-Cookie": `${STATE_COOKIE}=${state}; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=600`,
        },
      });
    }

    // ---------------------
    // GET /auth/callback
    // ---------------------
    if (url.pathname === "/auth/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const origin = getOrigin(request);

      // GitHub returned an error (e.g. user denied access)
      if (error) {
        const errorDescription =
          url.searchParams.get("error_description") || "Authorization denied";
        return Response.redirect(
          `${origin}/#error=${encodeURIComponent(errorDescription)}`,
          302,
        );
      }

      // Missing code or state
      if (!code || !state) {
        return Response.redirect(
          `${origin}/#error=${encodeURIComponent("Missing authorization code or state parameter")}`,
          302,
        );
      }

      // Validate state against the cookie (CSRF protection)
      const cookies = parseCookies(request.headers.get("Cookie"));
      const expectedState = cookies[STATE_COOKIE];
      if (!expectedState || expectedState !== state) {
        return Response.redirect(
          `${origin}/#error=${encodeURIComponent("Invalid state parameter. Please try signing in again.")}`,
          302,
        );
      }

      // Exchange code for access token
      // Use form-urlencoded (GitHub's recommended format) with Accept: application/json
      try {
        const redirectUri = `${origin}/auth/callback`;
        const body = new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        });

        // Retry up to 3 times to handle transient GitHub 5xx errors
        let tokenResponse: Response | null = null;
        let responseText = "";
        for (let attempt = 0; attempt < 3; attempt++) {
          tokenResponse = await fetch(GITHUB_TOKEN_URL, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "GitPulse",
            },
            body: body.toString(),
          });
          responseText = await tokenResponse.text();
          if (tokenResponse.status < 500) break;
          // Wait before retrying (500ms, 1s)
          if (attempt < 2)
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }

        if (!tokenResponse) {
          return Response.redirect(
            `${origin}/#error=${encodeURIComponent("Failed to reach GitHub. Please try again.")}`,
            302,
          );
        }

        let tokenData: {
          access_token?: string;
          error?: string;
          error_description?: string;
        };

        try {
          tokenData = JSON.parse(responseText);
        } catch {
          // GitHub returned non-JSON (e.g. HTML error page)
          const statusMsg =
            tokenResponse.status >= 500
              ? "GitHub is temporarily unavailable. Please try again in a moment."
              : "Unexpected response from GitHub during token exchange.";
          return Response.redirect(
            `${origin}/#error=${encodeURIComponent(statusMsg)}`,
            302,
          );
        }

        if (!tokenResponse.ok) {
          const msg =
            tokenData.error_description ||
            tokenData.error ||
            "Failed to exchange authorization code";
          return Response.redirect(
            `${origin}/#error=${encodeURIComponent(msg)}`,
            302,
          );
        }

        if (tokenData.error || !tokenData.access_token) {
          const msg =
            tokenData.error_description ||
            tokenData.error ||
            "Failed to obtain access token";
          return Response.redirect(
            `${origin}/#error=${encodeURIComponent(msg)}`,
            302,
          );
        }

        // Redirect to the SPA with the token in the hash fragment.
        // Hash fragments are never sent to the server in subsequent requests.
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${origin}/#token=${tokenData.access_token}`,
            // Clear the state cookie
            "Set-Cookie": `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=0`,
          },
        });
      } catch {
        return Response.redirect(
          `${origin}/#error=${encodeURIComponent("Network error during token exchange")}`,
          302,
        );
      }
    }

    // ---------------------
    // All other requests: serve static SPA assets
    // ---------------------
    const assetResponse = await env.ASSETS.fetch(request);

    // Add security headers to HTML responses
    const contentType = assetResponse.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const headers = new Headers(assetResponse.headers);
      headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://avatars.githubusercontent.com; connect-src 'self' https://api.github.com; frame-ancestors 'none';",
      );
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    }

    return assetResponse;
  },
};

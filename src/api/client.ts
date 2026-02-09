import { getToken, validateRepoFullName } from "@/lib/github";

const BASE_URL = "https://api.github.com";

/**
 * Validates a repo full name before using it in an API path.
 * Prevents path injection from malformed localStorage values.
 */
export function safeRepoPath(fullName: string): string {
  return validateRepoFullName(fullName);
}

export class GitHubApiError extends Error {
  status: number;
  rateLimitRemaining?: number;

  constructor(status: number, message: string, rateLimitRemaining?: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.rateLimitRemaining = rateLimitRemaining;
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function githubFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const token = getToken();
  if (!token) throw new GitHubApiError(401, "No GitHub token configured");

  const { params, ...fetchOptions } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...fetchOptions.headers,
    },
  });

  const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");

  if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
    console.warn(
      `GitHub API rate limit low: ${rateLimitRemaining} requests remaining`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new GitHubApiError(
      response.status,
      `GitHub API error: ${response.status} ${body}`,
      rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

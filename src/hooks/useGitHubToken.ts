import { useState, useCallback, useEffect } from "react";
import { getToken, setToken, clearToken } from "@/lib/github";

/**
 * Parse the URL hash fragment for OAuth callback parameters.
 * Supports: #token=xxx and #error=xxx
 */
function extractHashParam(key: string): string | null {
  const hash = window.location.hash.slice(1); // remove leading '#'
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get(key);
}

/**
 * Clear the URL hash without triggering a page reload.
 */
function clearHash(): void {
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

export function useGitHubToken() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // On mount, check if we arrived from an OAuth callback with a token or error in the hash
  useEffect(() => {
    const hashToken = extractHashParam("token");
    const hashError = extractHashParam("error");

    if (hashToken) {
      setToken(hashToken);
      setTokenState(hashToken);
      clearHash();
    } else if (hashError) {
      setOauthError(decodeURIComponent(hashError));
      clearHash();
    }
  }, []);

  const saveToken = useCallback((newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
  }, []);

  const removeToken = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  const clearOauthError = useCallback(() => {
    setOauthError(null);
  }, []);

  return {
    token,
    isAuthenticated: !!token,
    oauthError,
    saveToken,
    removeToken,
    clearOauthError,
  };
}

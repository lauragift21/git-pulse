import { useState, useCallback } from "react";
import { getToken, setToken, clearToken } from "@/lib/github";

export function useGitHubToken() {
  const [token, setTokenState] = useState<string | null>(getToken);

  const saveToken = useCallback((newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
  }, []);

  const removeToken = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  return {
    token,
    isAuthenticated: !!token,
    saveToken,
    removeToken,
  };
}

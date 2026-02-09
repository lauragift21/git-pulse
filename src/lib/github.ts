const TOKEN_KEY = "gitpulse_token";
const REPOS_KEY = "gitpulse_repos";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getTrackedRepos(): string[] {
  const raw = localStorage.getItem(REPOS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function setTrackedRepos(repos: string[]): void {
  localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
}

export function addTrackedRepo(fullName: string): void {
  const repos = getTrackedRepos();
  if (!repos.includes(fullName)) {
    repos.push(fullName);
    setTrackedRepos(repos);
  }
}

export function removeTrackedRepo(fullName: string): void {
  const repos = getTrackedRepos().filter((r) => r !== fullName);
  setTrackedRepos(repos);
}

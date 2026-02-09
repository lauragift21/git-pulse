const TOKEN_KEY = "gitpulse_token";
const REPOS_KEY = "gitpulse_repos";

/** Validates that a string matches the `owner/repo` format. */
const REPO_FULL_NAME_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

export function validateRepoFullName(fullName: string): string {
  if (!REPO_FULL_NAME_RE.test(fullName)) {
    throw new Error(`Invalid repository name: ${fullName}`);
  }
  return fullName;
}

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
  validateRepoFullName(fullName);
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

/** Extract "owner/repo" from a GitHub API repository URL. */
export function extractRepoFullName(repoUrl: string): string {
  const match = repoUrl.match(/repos\/([^/]+\/[^/]+)/);
  return match?.[1] ?? repoUrl;
}

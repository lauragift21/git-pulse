import { githubFetch } from "./client";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  html_url: string;
  visibility: string;
  default_branch: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    id: number;
  };
}

export async function fetchRepository(fullName: string): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(`/repos/${fullName}`);
}

export async function fetchUserRepos(username?: string): Promise<GitHubRepo[]> {
  const path = username ? `/users/${username}/repos` : "/user/repos";
  return githubFetch<GitHubRepo[]>(path, {
    params: { per_page: 100, sort: "updated" },
  });
}

export async function fetchTrackedRepos(
  fullNames: string[],
): Promise<GitHubRepo[]> {
  const results = await Promise.allSettled(
    fullNames.map((name) => fetchRepository(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubRepo> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}

export async function searchRepos(query: string): Promise<GitHubRepo[]> {
  if (!query.trim()) return [];
  const data = await githubFetch<{ items: GitHubRepo[] }>(
    "/search/repositories",
    {
      params: { q: query, per_page: 20 },
    },
  );
  return data.items;
}

export async function starRepo(fullName: string): Promise<void> {
  await githubFetch(`/user/starred/${fullName}`, { method: "PUT" });
}

export async function unstarRepo(fullName: string): Promise<void> {
  await githubFetch(`/user/starred/${fullName}`, { method: "DELETE" });
}

export async function checkStarred(fullName: string): Promise<boolean> {
  try {
    await githubFetch(`/user/starred/${fullName}`);
    return true;
  } catch (err) {
    // 404 means not starred — that's expected
    if (
      err instanceof Error &&
      "status" in err &&
      (err as { status: number }).status === 404
    ) {
      return false;
    }
    throw err;
  }
}

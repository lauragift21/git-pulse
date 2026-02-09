import { githubFetch } from "./client";

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    display_login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: Record<string, unknown>;
  public: boolean;
  created_at: string;
}

export async function fetchRepoEvents(
  fullName: string,
): Promise<GitHubEvent[]> {
  return githubFetch<GitHubEvent[]>(`/repos/${fullName}/events`, {
    params: { per_page: 100 },
  });
}

export async function fetchAllEvents(
  repoFullNames: string[],
): Promise<GitHubEvent[]> {
  const results = await Promise.allSettled(
    repoFullNames.map((name) => fetchRepoEvents(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubEvent[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r) => r.value)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export async function fetchUserInfo(): Promise<{
  login: string;
  avatar_url: string;
  name: string | null;
  id: number;
  html_url: string;
}> {
  return githubFetch("/user");
}

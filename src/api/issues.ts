import { githubFetch } from "./client";
import { extractRepoFullName } from "@/lib/github";

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GitHubMilestone {
  id: number;
  title: string;
  state: string;
  number: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  state_reason: string | null;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comments: number;
  user: GitHubUser;
  html_url: string;
  pull_request?: { url: string };
  repository_url: string;
}

export async function fetchRepoIssues(
  fullName: string,
  state: "open" | "closed" | "all" = "all",
): Promise<GitHubIssue[]> {
  const issues = await githubFetch<GitHubIssue[]>(`/repos/${fullName}/issues`, {
    params: { state, per_page: 100, sort: "updated" },
  });
  // GitHub's issues endpoint also returns PRs — filter them out
  return issues.filter((i) => !i.pull_request);
}

export async function fetchAllIssues(
  repoFullNames: string[],
): Promise<(GitHubIssue & { repository_full_name: string })[]> {
  const results = await Promise.allSettled(
    repoFullNames.map((name) => fetchRepoIssues(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubIssue[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r) =>
      r.value.map((issue) => ({
        ...issue,
        repository_full_name: extractRepoFullName(issue.repository_url),
      })),
    );
}

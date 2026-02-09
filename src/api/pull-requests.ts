import type { GitHubLabel, GitHubUser, GitHubMilestone } from "./issues";
import { githubFetch } from "./client";

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  draft: boolean;
  merged_at: string | null;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: GitHubUser;
  html_url: string;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  additions: number;
  deletions: number;
  changed_files: number;
  review_comments: number;
  commits: number;
  mergeable: boolean | null;
  repository_url: string;
}

function extractRepoFullName(repoUrl: string): string {
  return repoUrl.replace("https://api.github.com/repos/", "");
}

export async function fetchRepoPullRequests(
  fullName: string,
  state: "open" | "closed" | "all" = "all",
): Promise<GitHubPullRequest[]> {
  return githubFetch<GitHubPullRequest[]>(`/repos/${fullName}/pulls`, {
    params: { state, per_page: 100, sort: "updated" },
  });
}

export async function fetchAllPullRequests(
  repoFullNames: string[],
): Promise<(GitHubPullRequest & { repository_full_name: string })[]> {
  const results = await Promise.allSettled(
    repoFullNames.map((name) => fetchRepoPullRequests(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubPullRequest[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r) =>
      r.value.map((pr) => ({
        ...pr,
        repository_full_name: extractRepoFullName(pr.repository_url),
      })),
    );
}

export async function addPRReviewers(
  fullName: string,
  prNumber: number,
  reviewers: string[],
): Promise<void> {
  await githubFetch(
    `/repos/${fullName}/pulls/${prNumber}/requested_reviewers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewers }),
    },
  );
}

export async function updatePullRequest(
  fullName: string,
  prNumber: number,
  data: { state?: "open" | "closed"; labels?: string[] },
): Promise<GitHubPullRequest> {
  return githubFetch<GitHubPullRequest>(
    `/repos/${fullName}/pulls/${prNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
}

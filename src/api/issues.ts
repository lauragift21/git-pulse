import { githubFetch } from "./client";

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

function extractRepoFullName(repoUrl: string): string {
  // "https://api.github.com/repos/owner/repo" -> "owner/repo"
  return repoUrl.replace("https://api.github.com/repos/", "");
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

export async function addIssueLabel(
  fullName: string,
  issueNumber: number,
  labels: string[],
): Promise<GitHubLabel[]> {
  return githubFetch<GitHubLabel[]>(
    `/repos/${fullName}/issues/${issueNumber}/labels`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels }),
    },
  );
}

export async function removeIssueLabel(
  fullName: string,
  issueNumber: number,
  label: string,
): Promise<void> {
  await githubFetch(
    `/repos/${fullName}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`,
    { method: "DELETE" },
  );
}

export async function updateIssue(
  fullName: string,
  issueNumber: number,
  data: { state?: "open" | "closed"; assignees?: string[]; labels?: string[] },
): Promise<GitHubIssue> {
  return githubFetch<GitHubIssue>(`/repos/${fullName}/issues/${issueNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchRepoLabels(
  fullName: string,
): Promise<GitHubLabel[]> {
  return githubFetch<GitHubLabel[]>(`/repos/${fullName}/labels`, {
    params: { per_page: 100 },
  });
}

export async function fetchAllLabels(
  repoFullNames: string[],
): Promise<(GitHubLabel & { repository_full_name: string })[]> {
  const results = await Promise.allSettled(
    repoFullNames.map((name) => fetchRepoLabels(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubLabel[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r, i) =>
      r.value.map((label) => ({
        ...label,
        repository_full_name: repoFullNames[i],
      })),
    );
}

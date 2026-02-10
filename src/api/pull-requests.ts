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
}

export async function fetchRepoPullRequests(
  fullName: string,
  state: "open" | "closed" | "all" = "all",
): Promise<GitHubPullRequest[]> {
  return githubFetch<GitHubPullRequest[]>(`/repos/${fullName}/pulls`, {
    params: { state, per_page: 100, sort: "updated" },
  });
}

/**
 * Fetch a single PR's detail, which includes additions, deletions,
 * changed_files, commits, and other stats not returned by the list endpoint.
 */
export async function fetchPullRequestDetail(
  fullName: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  return githubFetch<GitHubPullRequest>(`/repos/${fullName}/pulls/${prNumber}`);
}

/**
 * Fetch open and closed PRs separately for each repo so that open PRs
 * are never crowded out by a large number of recently-updated closed PRs.
 */
export async function fetchAllPullRequests(
  repoFullNames: string[],
): Promise<(GitHubPullRequest & { repository_full_name: string })[]> {
  const results = await Promise.allSettled(
    repoFullNames.flatMap((name) => [
      fetchRepoPullRequests(name, "open"),
      fetchRepoPullRequests(name, "closed"),
    ]),
  );

  // Collect unique PRs from list results, tagging each with its repo name
  const listPRs: { pr: GitHubPullRequest; repoName: string }[] = [];
  const seen = new Set<number>();

  repoFullNames.forEach((repoName, repoIndex) => {
    // Two results per repo: open at 2*i, closed at 2*i+1
    for (let offset = 0; offset < 2; offset++) {
      const result = results[repoIndex * 2 + offset];
      if (result.status !== "fulfilled") continue;
      for (const pr of result.value) {
        if (seen.has(pr.id)) continue;
        seen.add(pr.id);
        listPRs.push({ pr, repoName });
      }
    }
  });

  // Fetch individual PR details in parallel to get additions/deletions/stats.
  // The list endpoint does not return these fields.
  const detailResults = await Promise.allSettled(
    listPRs.map(({ pr, repoName }) =>
      fetchPullRequestDetail(repoName, pr.number),
    ),
  );

  const allPRs: (GitHubPullRequest & { repository_full_name: string })[] = [];

  listPRs.forEach(({ pr, repoName }, index) => {
    const detail = detailResults[index];
    const detailData = detail.status === "fulfilled" ? detail.value : undefined;

    allPRs.push({
      ...pr,
      additions: detailData?.additions ?? pr.additions ?? 0,
      deletions: detailData?.deletions ?? pr.deletions ?? 0,
      changed_files: detailData?.changed_files ?? pr.changed_files ?? 0,
      review_comments: detailData?.review_comments ?? pr.review_comments ?? 0,
      commits: detailData?.commits ?? pr.commits ?? 0,
      mergeable: detailData?.mergeable ?? pr.mergeable ?? null,
      repository_full_name: repoName,
    });
  });

  return allPRs;
}

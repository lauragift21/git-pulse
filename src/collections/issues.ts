import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import { issueSchema, type Issue } from "@/schemas/issue";
import { fetchAllIssues } from "@/api/issues";
import { getTrackedRepos } from "@/lib/github";

export const issueCollection = createCollection(
  queryCollectionOptions({
    id: "issues",
    schema: issueSchema,
    getKey: (issue: Issue) => issue.id,
    queryKey: ["issues", getTrackedRepos()],
    queryFn: async (): Promise<Issue[]> => {
      const tracked = getTrackedRepos();
      if (tracked.length === 0) return [];
      const issues = await fetchAllIssues(tracked);
      // Add priority default since GitHub API doesn't include it
      return issues.map((issue) => ({ ...issue, priority: 0 }));
    },
    queryClient,
    staleTime: 60 * 1000,
  }),
);

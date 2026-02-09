import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import { pullRequestSchema, type PullRequest } from "@/schemas/pull-request";
import { fetchAllPullRequests } from "@/api/pull-requests";
import { getTrackedRepos } from "@/lib/github";

export const pullRequestCollection = createCollection(
  queryCollectionOptions({
    id: "pull-requests",
    schema: pullRequestSchema,
    getKey: (pr: PullRequest) => pr.id,
    queryKey: ["pull-requests", getTrackedRepos()],
    queryFn: async (): Promise<PullRequest[]> => {
      const tracked = getTrackedRepos();
      if (tracked.length === 0) return [];
      return fetchAllPullRequests(tracked);
    },
    queryClient,
    staleTime: 60 * 1000,
  }),
);

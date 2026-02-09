import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import { repositorySchema, type Repository } from "@/schemas/repository";
import { fetchTrackedRepos } from "@/api/repositories";
import { getTrackedRepos } from "@/lib/github";

export const repositoryCollection = createCollection(
  queryCollectionOptions({
    id: "repositories",
    schema: repositorySchema,
    getKey: (repo: Repository) => repo.id,
    queryKey: ["repositories", getTrackedRepos()],
    queryFn: async (): Promise<Repository[]> => {
      const tracked = getTrackedRepos();
      if (tracked.length === 0) return [];
      const repos = await fetchTrackedRepos(tracked);
      // Add starred_by_me default since GitHub API doesn't include it
      return repos.map((repo) => ({ ...repo, starred_by_me: false }));
    },
    queryClient,
    staleTime: 60 * 1000,
  }),
);

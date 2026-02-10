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
    queryKey: () => ["repositories", getTrackedRepos()],
    queryFn: async (): Promise<Repository[]> => {
      const tracked = getTrackedRepos();
      if (tracked.length === 0) return [];
      return fetchTrackedRepos(tracked);
    },
    queryClient,
    staleTime: 60 * 1000,
  }),
);

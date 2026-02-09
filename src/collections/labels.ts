import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import { labelSchema, type Label } from "@/schemas/label";
import { fetchAllLabels } from "@/api/issues";
import { getTrackedRepos } from "@/lib/github";

export const labelCollection = createCollection(
  queryCollectionOptions({
    id: "labels",
    schema: labelSchema,
    getKey: (label: Label) => label.id,
    queryKey: ["labels", getTrackedRepos()],
    queryFn: async (): Promise<Label[]> => {
      const tracked = getTrackedRepos();
      if (tracked.length === 0) return [];
      return fetchAllLabels(tracked);
    },
    queryClient,
    staleTime: 10 * 60 * 1000,
  }),
);

import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import { eventSchema, type Event } from "@/schemas/event";
import { fetchAllEvents } from "@/api/events";
import { getTrackedRepos } from "@/lib/github";

export const eventCollection = createCollection(
  queryCollectionOptions({
    id: "events",
    schema: eventSchema,
    getKey: (event: Event) => event.id,
    queryKey: () => ["events", getTrackedRepos()],
    queryFn: async (): Promise<Event[]> => {
      const tracked = getTrackedRepos();
      if (tracked.length === 0) return [];
      return fetchAllEvents(tracked);
    },
    queryClient,
    staleTime: 30 * 1000,
  }),
);

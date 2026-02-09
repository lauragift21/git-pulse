import type { InitialQueryBuilder } from "@tanstack/db";
import { eventCollection } from "@/collections/events";

/** All events (unfiltered, unsorted). */
export const allEvents = (q: InitialQueryBuilder) =>
  q.from({ event: eventCollection });

/** All events sorted by creation date (newest first). */
export const allEventsByDate = (q: InitialQueryBuilder) =>
  q
    .from({ event: eventCollection })
    .orderBy(({ event }) => event.created_at, "desc");

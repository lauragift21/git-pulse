import type { InitialQueryBuilder } from "@tanstack/db";
import { eq, and, count } from "@tanstack/react-db";
import { pullRequestCollection } from "@/collections/pull-requests";

/** All pull requests (unfiltered, unsorted). */
export const allPullRequests = (q: InitialQueryBuilder) =>
  q.from({ pr: pullRequestCollection });

/** All open PRs (non-draft) sorted by updated_at descending. */
export const openNonDraftPRs = (q: InitialQueryBuilder) =>
  q
    .from({ pr: pullRequestCollection })
    .where(({ pr }) => and(eq(pr.state, "open"), eq(pr.draft, false)))
    .orderBy(({ pr }) => pr.updated_at, "desc");

/** All open draft PRs sorted by updated_at descending. */
export const openDraftPRs = (q: InitialQueryBuilder) =>
  q
    .from({ pr: pullRequestCollection })
    .where(({ pr }) => and(eq(pr.state, "open"), eq(pr.draft, true)))
    .orderBy(({ pr }) => pr.updated_at, "desc");

/** All closed PRs sorted by updated_at descending. */
export const closedPRs = (q: InitialQueryBuilder) =>
  q
    .from({ pr: pullRequestCollection })
    .where(({ pr }) => eq(pr.state, "closed"))
    .orderBy(({ pr }) => pr.updated_at, "desc");

/** All open PRs. */
export const openPRs = (q: InitialQueryBuilder) =>
  q.from({ pr: pullRequestCollection }).where(({ pr }) => eq(pr.state, "open"));

/** Aggregate: total PR count. */
export const prCountAggregate = (q: InitialQueryBuilder) =>
  q.from({ pr: pullRequestCollection }).select(({ pr }) => ({
    total: count(pr.id),
  }));

import type { InitialQueryBuilder } from "@tanstack/db";
import { eq } from "@tanstack/react-db";
import { issueCollection } from "@/collections/issues";

/** All issues (unfiltered, unsorted). */
export const allIssues = (q: InitialQueryBuilder) =>
  q.from({ issue: issueCollection });

/** All open issues. */
export const openIssues = (q: InitialQueryBuilder) =>
  q
    .from({ issue: issueCollection })
    .where(({ issue }) => eq(issue.state, "open"));

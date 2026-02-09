import type { InitialQueryBuilder } from "@tanstack/db";
import { labelCollection } from "@/collections/labels";

/** All labels sorted by name (ascending). */
export const allLabelsByName = (q: InitialQueryBuilder) =>
  q.from({ label: labelCollection }).orderBy(({ label }) => label.name, "asc");

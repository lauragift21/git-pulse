import type { InitialQueryBuilder } from "@tanstack/db";
import { repositoryCollection } from "@/collections/repositories";

/** All repositories sorted by star count (descending). */
export const allReposByStars = (q: InitialQueryBuilder) =>
  q
    .from({ repo: repositoryCollection })
    .orderBy(({ repo }) => repo.stargazers_count, "desc");

/** All repositories sorted by full name (ascending). */
export const allReposByName = (q: InitialQueryBuilder) =>
  q
    .from({ repo: repositoryCollection })
    .orderBy(({ repo }) => repo.full_name, "asc");

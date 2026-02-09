import { createOptimisticAction } from "@tanstack/react-db";
import { repositoryCollection } from "@/collections/repositories";
import { starRepo, unstarRepo } from "@/api/repositories";

interface StarRepoVars {
  repoId: number;
  repoFullName: string;
}

export const starRepoAction = createOptimisticAction<StarRepoVars>({
  onMutate: ({ repoId }) => {
    repositoryCollection.update(repoId, (draft) => {
      draft.starred_by_me = true;
      draft.stargazers_count = (draft.stargazers_count ?? 0) + 1;
    });
  },
  mutationFn: async ({ repoFullName }) => {
    await starRepo(repoFullName);
    await repositoryCollection.utils.refetch();
  },
});

export const unstarRepoAction = createOptimisticAction<StarRepoVars>({
  onMutate: ({ repoId }) => {
    repositoryCollection.update(repoId, (draft) => {
      draft.starred_by_me = false;
      draft.stargazers_count = Math.max(0, (draft.stargazers_count ?? 1) - 1);
    });
  },
  mutationFn: async ({ repoFullName }) => {
    await unstarRepo(repoFullName);
    await repositoryCollection.utils.refetch();
  },
});

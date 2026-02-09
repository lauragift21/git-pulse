import { createOptimisticAction } from "@tanstack/react-db";
import { pullRequestCollection } from "@/collections/pull-requests";
import { addPRReviewers } from "@/api/pull-requests";
import { addIssueLabel, removeIssueLabel } from "@/api/issues";

interface AddPRLabelVars {
  prId: number;
  repoFullName: string;
  prNumber: number;
  label: {
    id: number;
    name: string;
    color: string;
    description: string | null;
  };
}

export const addPRLabelAction = createOptimisticAction<AddPRLabelVars>({
  onMutate: ({ prId, label }) => {
    pullRequestCollection.update(prId, (draft) => {
      const labels = draft.labels ?? [];
      if (!labels.some((l) => l.id === label.id)) {
        labels.push(label);
      }
      draft.labels = labels;
    });
  },
  mutationFn: async ({ repoFullName, prNumber, label }) => {
    // GitHub uses the issues endpoint for labels on PRs
    await addIssueLabel(repoFullName, prNumber, [label.name]);
    await pullRequestCollection.utils.refetch();
  },
});

interface RemovePRLabelVars {
  prId: number;
  repoFullName: string;
  prNumber: number;
  labelName: string;
}

export const removePRLabelAction = createOptimisticAction<RemovePRLabelVars>({
  onMutate: ({ prId, labelName }) => {
    pullRequestCollection.update(prId, (draft) => {
      draft.labels = (draft.labels ?? []).filter((l) => l.name !== labelName);
    });
  },
  mutationFn: async ({ repoFullName, prNumber, labelName }) => {
    await removeIssueLabel(repoFullName, prNumber, labelName);
    await pullRequestCollection.utils.refetch();
  },
});

interface RequestReviewVars {
  prId: number;
  repoFullName: string;
  prNumber: number;
  reviewer: {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export const requestReviewAction = createOptimisticAction<RequestReviewVars>({
  onMutate: ({ prId, reviewer }) => {
    pullRequestCollection.update(prId, (draft) => {
      const reviewers = draft.requested_reviewers ?? [];
      if (!reviewers.some((r) => r.id === reviewer.id)) {
        reviewers.push(reviewer);
      }
      draft.requested_reviewers = reviewers;
    });
  },
  mutationFn: async ({ repoFullName, prNumber, reviewer }) => {
    await addPRReviewers(repoFullName, prNumber, [reviewer.login]);
    await pullRequestCollection.utils.refetch();
  },
});

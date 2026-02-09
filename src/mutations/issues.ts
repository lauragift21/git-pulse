import { createOptimisticAction } from "@tanstack/react-db";
import { issueCollection } from "@/collections/issues";
import { updateIssue, addIssueLabel, removeIssueLabel } from "@/api/issues";

interface CloseIssueVars {
  issueId: number;
  repoFullName: string;
  issueNumber: number;
}

export const closeIssueAction = createOptimisticAction<CloseIssueVars>({
  onMutate: ({ issueId }) => {
    issueCollection.update(issueId, (draft) => {
      draft.state = "closed";
      draft.closed_at = new Date().toISOString();
    });
  },
  mutationFn: async ({ repoFullName, issueNumber }) => {
    await updateIssue(repoFullName, issueNumber, { state: "closed" });
    await issueCollection.utils.refetch();
  },
});

interface ReopenIssueVars {
  issueId: number;
  repoFullName: string;
  issueNumber: number;
}

export const reopenIssueAction = createOptimisticAction<ReopenIssueVars>({
  onMutate: ({ issueId }) => {
    issueCollection.update(issueId, (draft) => {
      draft.state = "open";
      draft.closed_at = null;
    });
  },
  mutationFn: async ({ repoFullName, issueNumber }) => {
    await updateIssue(repoFullName, issueNumber, { state: "open" });
    await issueCollection.utils.refetch();
  },
});

interface AddLabelVars {
  issueId: number;
  repoFullName: string;
  issueNumber: number;
  label: {
    id: number;
    name: string;
    color: string;
    description: string | null;
  };
}

export const addIssueLabelAction = createOptimisticAction<AddLabelVars>({
  onMutate: ({ issueId, label }) => {
    issueCollection.update(issueId, (draft) => {
      const labels = draft.labels ?? [];
      if (!labels.some((l) => l.id === label.id)) {
        labels.push(label);
      }
      draft.labels = labels;
    });
  },
  mutationFn: async ({ repoFullName, issueNumber, label }) => {
    await addIssueLabel(repoFullName, issueNumber, [label.name]);
    await issueCollection.utils.refetch();
  },
});

interface RemoveLabelVars {
  issueId: number;
  repoFullName: string;
  issueNumber: number;
  labelName: string;
}

export const removeIssueLabelAction = createOptimisticAction<RemoveLabelVars>({
  onMutate: ({ issueId, labelName }) => {
    issueCollection.update(issueId, (draft) => {
      draft.labels = (draft.labels ?? []).filter((l) => l.name !== labelName);
    });
  },
  mutationFn: async ({ repoFullName, issueNumber, labelName }) => {
    await removeIssueLabel(repoFullName, issueNumber, labelName);
    await issueCollection.utils.refetch();
  },
});

interface AssignIssueVars {
  issueId: number;
  repoFullName: string;
  issueNumber: number;
  assignee: { id: number; login: string; avatar_url: string; html_url: string };
}

export const assignIssueAction = createOptimisticAction<AssignIssueVars>({
  onMutate: ({ issueId, assignee }) => {
    issueCollection.update(issueId, (draft) => {
      const assignees = draft.assignees ?? [];
      if (!assignees.some((a) => a.id === assignee.id)) {
        assignees.push(assignee);
      }
      draft.assignees = assignees;
    });
  },
  mutationFn: async ({ repoFullName, issueNumber, issueId, assignee }) => {
    // Collect existing assignees to avoid replacing them
    const existing = issueCollection.state.get(issueId);
    const existingLogins = (existing?.assignees ?? []).map(
      (a: { login: string }) => a.login,
    );
    const allLogins = [...new Set([...existingLogins, assignee.login])];
    await updateIssue(repoFullName, issueNumber, { assignees: allLogins });
    await issueCollection.utils.refetch();
  },
});

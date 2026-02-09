import { useState, useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  allPullRequests,
  openNonDraftPRs,
  openDraftPRs,
  closedPRs as closedPRsQuery,
} from "@/queries/pull-requests";
import type { PullRequest } from "@/schemas/pull-request";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { labelStyle } from "@/lib/colors";
import { timeAgo } from "@/lib/date";
import {
  GitPullRequest,
  GitMerge,
  XCircle,
  Filter,
  ExternalLink,
  MessageSquare,
  FileCode,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface Filters {
  repo: string;
  author: string;
  label: string;
  draftsOnly: boolean;
}

function FilterBar({
  filters,
  onChange,
  repoOptions,
  labelOptions,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  repoOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border-primary bg-bg-primary px-6 py-3">
      <Filter size={14} className="text-text-tertiary mt-1.5" />
      <Select
        options={repoOptions}
        value={filters.repo}
        onChange={(e) => onChange({ ...filters, repo: e.target.value })}
        className="w-48"
      />
      <Input
        placeholder="Filter by author..."
        value={filters.author}
        onChange={(e) => onChange({ ...filters, author: e.target.value })}
        className="w-44 !py-1.5"
      />
      <Select
        options={labelOptions}
        value={filters.label}
        onChange={(e) => onChange({ ...filters, label: e.target.value })}
        className="w-44"
      />
      <Button
        variant={filters.draftsOnly ? "primary" : "secondary"}
        size="sm"
        onClick={() =>
          onChange({ ...filters, draftsOnly: !filters.draftsOnly })
        }
      >
        Drafts only
      </Button>
      {(filters.repo ||
        filters.author ||
        filters.label ||
        filters.draftsOnly) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ repo: "", author: "", label: "", draftsOnly: false })
          }
        >
          Clear
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column header
// ---------------------------------------------------------------------------

function ColumnHeader({
  icon,
  title,
  count,
  accentClass,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1 pb-3">
      <span className={accentClass}>{icon}</span>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <span className="ml-auto rounded-full bg-bg-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PR card
// ---------------------------------------------------------------------------

function PRCard({ pr }: { pr: PullRequest }) {
  const isMerged = pr.state === "closed" && pr.merged_at !== null;

  return (
    <Card hover padding="none" className="group">
      <div className="p-3.5">
        {/* Title row */}
        <div className="flex items-start gap-2 mb-2">
          <span className="mt-0.5 shrink-0">
            {isMerged ? (
              <GitMerge size={14} className="text-text-secondary" />
            ) : pr.state === "closed" ? (
              <XCircle size={14} className="text-text-tertiary" />
            ) : pr.draft ? (
              <GitPullRequest size={14} className="text-text-tertiary" />
            ) : (
              <GitPullRequest size={14} className="text-text-primary" />
            )}
          </span>
          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-primary leading-snug hover:text-accent-blue transition-colors line-clamp-2"
          >
            {pr.title}
            <ExternalLink
              size={11}
              className="inline ml-1 opacity-0 group-hover:opacity-60 transition-opacity"
            />
          </a>
        </div>

        {/* Repo + branch */}
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-2.5">
          <FileCode size={12} />
          <span className="truncate">{pr.repository_full_name}</span>
          <span className="text-text-tertiary/50 mx-0.5">&middot;</span>
          <span className="truncate font-mono text-[11px]">
            {pr.head.ref} &rarr; {pr.base.ref}
          </span>
        </div>

        {/* Labels */}
        {pr.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {pr.labels.map((label) => (
              <Badge key={label.id} style={labelStyle(label.color)}>
                {label.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-text-tertiary mb-2.5">
          <span className="text-text-primary font-medium">
            +{pr.additions.toLocaleString()}
          </span>
          <span className="text-text-tertiary font-medium">
            -{pr.deletions.toLocaleString()}
          </span>
          {pr.changed_files > 0 && (
            <span className="flex items-center gap-0.5">
              <FileCode size={11} />
              {pr.changed_files}
            </span>
          )}
          {pr.review_comments > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare size={11} />
              {pr.review_comments}
            </span>
          )}
        </div>

        {/* Footer: author + reviewers + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar src={pr.user.avatar_url} alt={pr.user.login} size="xs" />
            <span className="text-xs text-text-secondary">{pr.user.login}</span>
          </div>
          <div className="flex items-center gap-2">
            {pr.requested_reviewers.length > 0 && (
              <AvatarGroup
                avatars={pr.requested_reviewers.map((r) => ({
                  src: r.avatar_url,
                  alt: r.login,
                }))}
                max={3}
                size="xs"
              />
            )}
            <span className="text-[11px] text-text-tertiary whitespace-nowrap">
              {timeAgo(pr.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Kanban column
// ---------------------------------------------------------------------------

function KanbanColumn({
  icon,
  title,
  accentClass,
  prs,
  emptyIcon,
  emptyText,
}: {
  icon: React.ReactNode;
  title: string;
  accentClass: string;
  prs: PullRequest[];
  emptyIcon: React.ReactNode;
  emptyText: string;
}) {
  return (
    <section className="flex flex-col min-w-[320px] flex-1 max-w-[480px]">
      <ColumnHeader
        icon={icon}
        title={title}
        count={prs.length}
        accentClass={accentClass}
      />
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-4 scrollbar-thin">
        {prs.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title="No pull requests"
            description={emptyText}
          />
        ) : (
          prs.map((pr) => <PRCard key={pr.id} pr={pr} />)
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Apply client-side filters
// ---------------------------------------------------------------------------

function applyFilters(prs: PullRequest[], filters: Filters): PullRequest[] {
  let filtered = prs;

  if (filters.repo) {
    filtered = filtered.filter(
      (pr) => pr.repository_full_name === filters.repo,
    );
  }

  if (filters.author) {
    const q = filters.author.toLowerCase();
    filtered = filtered.filter((pr) => pr.user.login.toLowerCase().includes(q));
  }

  if (filters.label) {
    filtered = filtered.filter((pr) =>
      pr.labels.some((l) => l.name === filters.label),
    );
  }

  if (filters.draftsOnly) {
    filtered = filtered.filter((pr) => pr.draft);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function PullRequests() {
  const [filters, setFilters] = useState<Filters>({
    repo: "",
    author: "",
    label: "",
    draftsOnly: false,
  });

  // ---- Open PRs (not draft) ----
  const { data: openPRs = [] } = useLiveQuery(openNonDraftPRs, []);

  // ---- Draft / In Review PRs ----
  const { data: draftReviewPRs = [] } = useLiveQuery(openDraftPRs, []);

  // We also want open PRs that have requested_reviewers (in-review).
  // TanStack DB doesn't support array-length filters, so we merge client-side.
  const inReviewFromOpen = useMemo(
    () => openPRs.filter((pr) => pr.requested_reviewers.length > 0),
    [openPRs],
  );

  // Combine drafts + in-review, deduplicate by id
  const draftAndReviewPRs = useMemo(() => {
    const map = new Map<number, PullRequest>();
    for (const pr of draftReviewPRs) map.set(pr.id, pr);
    for (const pr of inReviewFromOpen) map.set(pr.id, pr);
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [draftReviewPRs, inReviewFromOpen]);

  // ---- Merged / Closed PRs ----
  const { data: closedPRs = [] } = useLiveQuery(closedPRsQuery, []);

  // ---- All PRs for deriving filter options ----
  const { data: allPRs = [] } = useLiveQuery(allPullRequests, []);

  // Derive unique repos
  const repoOptions = useMemo(() => {
    const repos = [
      ...new Set(allPRs.map((pr) => pr.repository_full_name)),
    ].sort();
    return [
      { value: "", label: "All repositories" },
      ...repos.map((r) => ({ value: r, label: r })),
    ];
  }, [allPRs]);

  // Derive unique labels
  const labelOptions = useMemo(() => {
    const names = [
      ...new Set(allPRs.flatMap((pr) => pr.labels.map((l) => l.name))),
    ].sort();
    return [
      { value: "", label: "All labels" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [allPRs]);

  // Apply client-side filters to each column
  const filteredOpen = applyFilters(openPRs, filters);
  const filteredDraftReview = applyFilters(draftAndReviewPRs, filters);
  const filteredClosed = applyFilters(closedPRs, filters);

  return (
    <div className="flex flex-col h-full min-h-screen">
      <Header title="Pull Requests" subtitle="Manage PRs across repositories" />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        repoOptions={repoOptions}
        labelOptions={labelOptions}
      />

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-5 h-full px-6 py-5 overflow-x-auto">
          {/* Open column */}
          <KanbanColumn
            icon={<GitPullRequest size={15} />}
            title="Open"
            accentClass="text-text-primary"
            prs={filteredOpen}
            emptyIcon={<GitPullRequest size={32} />}
            emptyText="No open pull requests match the current filters."
          />

          {/* Draft / In Review column */}
          <KanbanColumn
            icon={<GitPullRequest size={15} />}
            title="Draft / In Review"
            accentClass="text-text-secondary"
            prs={filteredDraftReview}
            emptyIcon={<MessageSquare size={32} />}
            emptyText="No draft or in-review pull requests right now."
          />

          {/* Merged / Closed column */}
          <KanbanColumn
            icon={<GitMerge size={15} />}
            title="Merged / Closed"
            accentClass="text-text-tertiary"
            prs={filteredClosed}
            emptyIcon={<GitMerge size={32} />}
            emptyText="No merged or closed pull requests match the filters."
          />
        </div>
      </div>
    </div>
  );
}

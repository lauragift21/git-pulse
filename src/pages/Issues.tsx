import { useState, useCallback, useMemo } from "react";
import { useLiveQuery, eq, ilike } from "@tanstack/react-db";
import {
  CircleDot,
  CheckCircle2,
  Search,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Filter,
  ExternalLink,
} from "lucide-react";
import { issueCollection } from "@/collections/issues";
import { repositoryCollection } from "@/collections/repositories";
import { labelCollection } from "@/collections/labels";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { timeAgo } from "@/lib/date";
import { labelStyle } from "@/lib/colors";
import { closeIssueAction, reopenIssueAction } from "@/mutations/issues";
import type { Issue } from "@/schemas/issue";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type StateFilter = "all" | "open" | "closed";
type SortField = "title" | "updated_at" | "comments" | "created_at";
type SortDir = "asc" | "desc";

/* -------------------------------------------------------------------------- */
/*  Sort column header                                                         */
/* -------------------------------------------------------------------------- */

interface SortHeaderProps {
  label: string;
  field: SortField;
  activeField: SortField;
  direction: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
  className = "",
}: SortHeaderProps) {
  const isActive = activeField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors cursor-pointer ${className}`}
    >
      {label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp size={12} className="text-black dark:text-white" />
        ) : (
          <ArrowDown size={12} className="text-black dark:text-white" />
        )
      ) : (
        <ArrowUpDown size={12} className="opacity-40" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function Issues() {
  /* -- State -- */
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [repoFilter, setRepoFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* -- Queries -- */

  // Issues: filter by state and search using TanStack DB operators
  const { data: issueRows = [] } = useLiveQuery(
    (q) => {
      let query = q.from({ issue: issueCollection });

      if (stateFilter !== "all") {
        query = query.where(({ issue }) => eq(issue.state, stateFilter));
      }
      if (searchTerm) {
        query = query.where(({ issue }) =>
          ilike(issue.title, `%${searchTerm}%`),
        );
      }

      return query.orderBy(({ issue }) => issue[sortField], sortDir);
    },
    [stateFilter, searchTerm, sortField, sortDir],
  );

  // Repositories for filter dropdown
  const { data: repos = [] } = useLiveQuery(
    (q) =>
      q
        .from({ repo: repositoryCollection })
        .orderBy(({ repo }) => repo.full_name, "asc"),
    [],
  );

  // All labels for filter dropdown
  const { data: allLabelsRaw = [] } = useLiveQuery(
    (q) =>
      q
        .from({ label: labelCollection })
        .orderBy(({ label }) => label.name, "asc"),
    [],
  );

  /* -- Derived data -- */

  // Deduplicate labels by name
  const uniqueLabels = useMemo(() => {
    const seen = new Set<string>();
    return allLabelsRaw.filter((l: { name: string }) => {
      if (seen.has(l.name)) return false;
      seen.add(l.name);
      return true;
    });
  }, [allLabelsRaw]);

  // Client-side filters for repo and label (applied after TanStack DB query)
  const issues: Issue[] = useMemo(() => {
    let result = issueRows as Issue[];

    if (repoFilter !== "all") {
      result = result.filter((i) => i.repository_full_name === repoFilter);
    }
    if (labelFilter !== "all") {
      result = result.filter((i) =>
        i.labels.some((l) => l.name === labelFilter),
      );
    }

    return result;
  }, [issueRows, repoFilter, labelFilter]);

  /* -- Counts for state pills -- */
  const openCount = issues.filter((i) => i.state === "open").length;
  const closedCount = issues.filter((i) => i.state === "closed").length;

  /* -- Selection helpers -- */

  const allSelected =
    issues.length > 0 && issues.every((i) => selectedIds.has(i.id));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(issues.map((i) => i.id)));
    }
  }, [allSelected, issues]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* -- Sort handler -- */

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(field === "title" ? "asc" : "desc");
      }
    },
    [sortField],
  );

  /* -- Bulk actions -- */

  const selectedIssues = useMemo(
    () => issues.filter((i) => selectedIds.has(i.id)),
    [issues, selectedIds],
  );

  const handleBulkClose = useCallback(() => {
    for (const issue of selectedIssues) {
      if (issue.state === "open") {
        closeIssueAction({
          issueId: issue.id,
          repoFullName: issue.repository_full_name,
          issueNumber: issue.number,
        });
      }
    }
    setSelectedIds(new Set());
  }, [selectedIssues]);

  const handleBulkReopen = useCallback(() => {
    for (const issue of selectedIssues) {
      if (issue.state === "closed") {
        reopenIssueAction({
          issueId: issue.id,
          repoFullName: issue.repository_full_name,
          issueNumber: issue.number,
        });
      }
    }
    setSelectedIds(new Set());
  }, [selectedIssues]);

  /* -- Filter option lists -- */

  const repoOptions = useMemo(
    () => [
      { value: "all", label: "All repositories" },
      ...repos.map((r: { full_name: string }) => ({
        value: r.full_name,
        label: r.full_name,
      })),
    ],
    [repos],
  );

  const labelOptions = useMemo(
    () => [
      { value: "all", label: "All labels" },
      ...uniqueLabels.map((l: { name: string }) => ({
        value: l.name,
        label: l.name,
      })),
    ],
    [uniqueLabels],
  );

  const hasActiveFilters =
    stateFilter !== "all" ||
    repoFilter !== "all" ||
    labelFilter !== "all" ||
    searchTerm !== "";

  const clearFilters = useCallback(() => {
    setStateFilter("all");
    setRepoFilter("all");
    setLabelFilter("all");
    setSearchTerm("");
  }, []);

  /* -- Render -- */

  return (
    <div className="flex flex-col h-full">
      <Header title="Issues" subtitle="Track issues across repositories" />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* ---- Toolbar ---- */}
        <Card padding="sm">
          <div className="flex flex-col gap-3">
            {/* Top row: search + state chips */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search issues..."
                  className="w-full rounded-lg border border-border-primary bg-bg-primary pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* State filter chips */}
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: "all", label: "All", count: issues.length },
                    { key: "open", label: "Open", count: openCount },
                    { key: "closed", label: "Closed", count: closedCount },
                  ] as const
                ).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setStateFilter(key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                      stateFilter === key
                        ? "bg-accent-primary text-white"
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80 hover:text-text-primary"
                    }`}
                  >
                    {label}
                    <span className="ml-1.5 opacity-75">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: dropdowns + clear */}
            <div className="flex items-center gap-3 flex-wrap">
              <Filter size={14} className="text-text-tertiary" />

              <Select
                options={repoOptions}
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
                className="min-w-[180px]"
              />

              <Select
                options={labelOptions}
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                className="min-w-[150px]"
              />

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={12} />
                  Clear filters
                </Button>
              )}

              <span className="ml-auto text-xs text-text-tertiary">
                {issues.length} issue{issues.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </Card>

        {/* ---- Bulk actions bar ---- */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-accent-blue/30 bg-accent-blue/5 px-4 py-2">
            <span className="text-sm font-medium text-text-primary">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-border-primary" />
            <Button variant="secondary" size="sm" onClick={handleBulkClose}>
              <CheckCircle2 size={14} className="text-purple-500" />
              Close selected
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkReopen}>
              <CircleDot size={14} className="text-emerald-500" />
              Reopen selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto"
            >
              <X size={12} />
              Deselect
            </Button>
          </div>
        )}

        {/* ---- Issue table ---- */}
        {issues.length === 0 ? (
          <EmptyState
            icon={<CircleDot size={40} />}
            title="No issues found"
            description={
              hasActiveFilters
                ? "No issues match the current filters. Try adjusting your search or clearing the filters."
                : "There are no issues yet. Issues from your tracked repositories will appear here."
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                {/* Table head */}
                <thead>
                  <tr className="border-b border-border-primary bg-bg-secondary">
                    <th className="w-10 px-3 py-2.5 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-border-primary accent-accent-blue cursor-pointer"
                      />
                    </th>
                    <th className="w-8 px-1 py-2.5" />
                    <th className="px-3 py-2.5 text-left">
                      <SortHeader
                        label="Title"
                        field="title"
                        activeField={sortField}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                        Repository
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                        Assignees
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-center">
                      <SortHeader
                        label="Comments"
                        field="comments"
                        activeField={sortField}
                        direction={sortDir}
                        onSort={handleSort}
                        className="justify-center"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <SortHeader
                        label="Updated"
                        field="updated_at"
                        activeField={sortField}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <SortHeader
                        label="Created"
                        field="created_at"
                        activeField={sortField}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="w-10 px-3 py-2.5" />
                  </tr>
                </thead>

                {/* Table body */}
                <tbody>
                  {issues.map((issue, idx) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      selected={selectedIds.has(issue.id)}
                      onToggle={toggleOne}
                      striped={idx % 2 === 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Issue row                                                                   */
/* -------------------------------------------------------------------------- */

interface IssueRowProps {
  issue: Issue;
  selected: boolean;
  onToggle: (id: number) => void;
  striped: boolean;
}

function IssueRow({ issue, selected, onToggle, striped }: IssueRowProps) {
  const isOpen = issue.state === "open";

  const handleStateToggle = () => {
    if (isOpen) {
      closeIssueAction({
        issueId: issue.id,
        repoFullName: issue.repository_full_name,
        issueNumber: issue.number,
      });
    } else {
      reopenIssueAction({
        issueId: issue.id,
        repoFullName: issue.repository_full_name,
        issueNumber: issue.number,
      });
    }
  };

  return (
    <tr
      className={`group border-b border-border-primary last:border-b-0 transition-colors duration-100 ${
        selected
          ? "bg-accent-blue/5"
          : striped
            ? "bg-bg-secondary/50"
            : "bg-bg-card"
      } hover:bg-bg-hover`}
    >
      {/* Checkbox */}
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(issue.id)}
          className="rounded border-border-primary accent-accent-blue cursor-pointer"
        />
      </td>

      {/* State icon */}
      <td className="px-1 py-2.5">
        <button
          onClick={handleStateToggle}
          title={isOpen ? "Close issue" : "Reopen issue"}
          className="cursor-pointer hover:opacity-70 transition-opacity"
        >
          {isOpen ? (
            <CircleDot size={16} className="text-emerald-500" />
          ) : (
            <CheckCircle2 size={16} className="text-purple-500" />
          )}
        </button>
      </td>

      {/* Title + labels */}
      <td className="px-3 py-2.5 max-w-[400px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary truncate max-w-[280px]">
            {issue.title}
          </span>
          {issue.labels.map((label) => (
            <Badge
              key={label.id}
              style={labelStyle(label.color)}
              className="whitespace-nowrap"
            >
              {label.name}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-tertiary">#{issue.number}</span>
          {issue.user && (
            <span className="text-xs text-text-tertiary">
              opened by {issue.user.login}
            </span>
          )}
        </div>
      </td>

      {/* Repository */}
      <td className="px-3 py-2.5">
        <span className="text-xs text-text-secondary font-mono truncate block max-w-[180px]">
          {issue.repository_full_name}
        </span>
      </td>

      {/* Assignees */}
      <td className="px-3 py-2.5">
        {issue.assignees.length > 0 ? (
          <AvatarGroup
            avatars={issue.assignees.map((a) => ({
              src: a.avatar_url,
              alt: a.login,
            }))}
            max={3}
            size="xs"
          />
        ) : (
          <span className="text-xs text-text-tertiary">&mdash;</span>
        )}
      </td>

      {/* Comments */}
      <td className="px-3 py-2.5 text-center">
        {issue.comments > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <MessageSquare size={12} className="text-text-tertiary" />
            {issue.comments}
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">&mdash;</span>
        )}
      </td>

      {/* Updated */}
      <td className="px-3 py-2.5">
        <time
          dateTime={issue.updated_at}
          className="text-xs text-text-secondary whitespace-nowrap"
        >
          {timeAgo(issue.updated_at)}
        </time>
      </td>

      {/* Created */}
      <td className="px-3 py-2.5">
        <time
          dateTime={issue.created_at}
          className="text-xs text-text-secondary whitespace-nowrap"
        >
          {timeAgo(issue.created_at)}
        </time>
      </td>

      {/* Link */}
      <td className="px-3 py-2.5">
        <a
          href={issue.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-tertiary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink size={14} />
        </a>
      </td>
    </tr>
  );
}

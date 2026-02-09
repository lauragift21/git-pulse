import { useState } from "react";
import { useLiveQuery, inArray } from "@tanstack/react-db";
import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  Star,
  GitFork,
  Tag,
  Trash2,
  Package,
  Activity,
  Filter,
  ExternalLink,
} from "lucide-react";
import { eventCollection } from "@/collections/events";
import { Header } from "@/components/layout/Header";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo, groupDateLabel } from "@/lib/date";
import type { Event } from "@/schemas/event";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const EVENT_FILTERS = [
  "All",
  "PushEvent",
  "PullRequestEvent",
  "IssuesEvent",
  "WatchEvent",
  "ForkEvent",
  "ReleaseEvent",
] as const;

type EventFilter = (typeof EVENT_FILTERS)[number];

const CHIP_LABELS: Record<EventFilter, string> = {
  All: "All",
  PushEvent: "Push",
  PullRequestEvent: "Pull Requests",
  IssuesEvent: "Issues",
  WatchEvent: "Stars",
  ForkEvent: "Forks",
  ReleaseEvent: "Releases",
};

/* -------------------------------------------------------------------------- */
/*  Event type → icon / colour / description                                  */
/* -------------------------------------------------------------------------- */

interface EventMeta {
  icon: React.ReactNode;
  color: string;
  badgeVariant:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple";
}

function getEventMeta(type: string): EventMeta {
  switch (type) {
    case "PushEvent":
      return {
        icon: <GitCommit size={16} />,
        color: "text-black dark:text-white",
        badgeVariant: "info",
      };
    case "PullRequestEvent":
      return {
        icon: <GitPullRequest size={16} />,
        color: "text-black dark:text-white",
        badgeVariant: "default",
      };
    case "IssuesEvent":
      return {
        icon: <CircleDot size={16} />,
        color: "text-black dark:text-white",
        badgeVariant: "default",
      };
    case "WatchEvent":
      return {
        icon: <Star size={16} />,
        color: "text-neutral-600 dark:text-neutral-400",
        badgeVariant: "default",
      };
    case "ForkEvent":
      return {
        icon: <GitFork size={16} />,
        color: "text-neutral-600 dark:text-neutral-400",
        badgeVariant: "default",
      };
    case "CreateEvent":
      return {
        icon: <Tag size={16} />,
        color: "text-black dark:text-white",
        badgeVariant: "default",
      };
    case "DeleteEvent":
      return {
        icon: <Trash2 size={16} />,
        color: "text-neutral-500",
        badgeVariant: "default",
      };
    case "ReleaseEvent":
      return {
        icon: <Package size={16} />,
        color: "text-neutral-600 dark:text-neutral-400",
        badgeVariant: "default",
      };
    case "PullRequestReviewEvent":
    case "PullRequestReviewCommentEvent":
      return {
        icon: <GitPullRequest size={16} />,
        color: "text-black dark:text-white",
        badgeVariant: "default",
      };
    case "IssueCommentEvent":
      return {
        icon: <CircleDot size={16} />,
        color: "text-black dark:text-white",
        badgeVariant: "default",
      };
    default:
      return {
        icon: <Activity size={16} />,
        color: "text-text-secondary",
        badgeVariant: "default",
      };
  }
}

function getEventDescription(event: Event): string {
  const payload = event.payload as Record<string, unknown>;

  switch (event.type) {
    case "PushEvent": {
      const commits = payload.commits as unknown[] | undefined;
      const size = payload.size as number | undefined;
      const count = commits?.length ?? size ?? 0;
      if (count > 0) {
        return `pushed ${count} commit${count !== 1 ? "s" : ""} to ${event.repo.name}`;
      }
      const ref = payload.ref as string | undefined;
      const branch = ref?.replace("refs/heads/", "") ?? "";
      return `pushed to ${branch ? `${branch} in ` : ""}${event.repo.name}`;
    }
    case "PullRequestEvent": {
      const action = (payload.action as string) ?? "opened";
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const number = pr?.number ?? "";
      return `${action} pull request #${number}`;
    }
    case "IssuesEvent": {
      const action = (payload.action as string) ?? "opened";
      const issue = payload.issue as Record<string, unknown> | undefined;
      const number = issue?.number ?? "";
      return `${action} issue #${number}`;
    }
    case "WatchEvent":
      return `starred ${event.repo.name}`;
    case "ForkEvent":
      return `forked ${event.repo.name}`;
    case "CreateEvent": {
      const refType = (payload.ref_type as string) ?? "branch";
      return `created ${refType}`;
    }
    case "DeleteEvent": {
      const refType = (payload.ref_type as string) ?? "branch";
      return `deleted ${refType}`;
    }
    case "ReleaseEvent": {
      const release = payload.release as Record<string, unknown> | undefined;
      const name = release?.name ?? "a release";
      return `published release ${name}`;
    }
    case "PullRequestReviewEvent": {
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const number = pr?.number ?? "";
      const action = (payload.action as string) ?? "submitted";
      return `${action} a review on pull request #${number}`;
    }
    case "PullRequestReviewCommentEvent": {
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const number = pr?.number ?? "";
      return `commented on pull request #${number}`;
    }
    case "IssueCommentEvent": {
      const issue = payload.issue as Record<string, unknown> | undefined;
      const number = issue?.number ?? "";
      return `commented on issue #${number}`;
    }
    default:
      return `performed ${event.type}`;
  }
}

/* -------------------------------------------------------------------------- */
/*  Event → GitHub URL                                                         */
/* -------------------------------------------------------------------------- */

function getEventUrl(event: Event): string {
  const payload = event.payload as Record<string, unknown>;
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case "PushEvent": {
      // Link to the compare view for the push range, or the head commit
      const before = payload.before as string | undefined;
      const head = payload.head as string | undefined;
      if (before && head && before !== head) {
        return `${repoUrl}/compare/${before.slice(0, 12)}...${head.slice(0, 12)}`;
      }
      return head ? `${repoUrl}/commit/${head}` : repoUrl;
    }
    case "PullRequestEvent": {
      // Construct URL from repo + PR number (html_url may not be in Events API payload)
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const number = pr?.number as number | undefined;
      return number ? `${repoUrl}/pull/${number}` : repoUrl;
    }
    case "IssuesEvent": {
      const issue = payload.issue as Record<string, unknown> | undefined;
      const number = issue?.number as number | undefined;
      return number ? `${repoUrl}/issues/${number}` : repoUrl;
    }
    case "IssueCommentEvent": {
      const issue = payload.issue as Record<string, unknown> | undefined;
      const comment = payload.comment as Record<string, unknown> | undefined;
      const number = issue?.number as number | undefined;
      const commentId = comment?.id as number | undefined;
      if (number && commentId) {
        return `${repoUrl}/issues/${number}#issuecomment-${commentId}`;
      }
      return number ? `${repoUrl}/issues/${number}` : repoUrl;
    }
    case "ForkEvent": {
      const forkee = payload.forkee as Record<string, unknown> | undefined;
      const fullName = forkee?.full_name as string | undefined;
      return fullName ? `https://github.com/${fullName}` : repoUrl;
    }
    case "ReleaseEvent": {
      const release = payload.release as Record<string, unknown> | undefined;
      const tagName = release?.tag_name as string | undefined;
      return tagName ? `${repoUrl}/releases/tag/${tagName}` : repoUrl;
    }
    case "CreateEvent": {
      const refType = payload.ref_type as string | undefined;
      const ref = payload.ref as string | undefined;
      if (refType === "tag" && ref) return `${repoUrl}/releases/tag/${ref}`;
      if (refType === "branch" && ref) return `${repoUrl}/tree/${ref}`;
      return repoUrl;
    }
    case "PullRequestReviewEvent": {
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const number = pr?.number as number | undefined;
      return number ? `${repoUrl}/pull/${number}#pullrequestreview` : repoUrl;
    }
    case "PullRequestReviewCommentEvent": {
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const comment = payload.comment as Record<string, unknown> | undefined;
      const number = pr?.number as number | undefined;
      const commentId = comment?.id as number | undefined;
      if (number && commentId) {
        return `${repoUrl}/pull/${number}#discussion_r${commentId}`;
      }
      return number ? `${repoUrl}/pull/${number}` : repoUrl;
    }
    case "DeleteEvent":
    case "WatchEvent":
      return repoUrl;
    default:
      return repoUrl;
  }
}

/* -------------------------------------------------------------------------- */
/*  Group events by day                                                        */
/* -------------------------------------------------------------------------- */

function groupByDay(events: Event[]): Map<string, Event[]> {
  const groups = new Map<string, Event[]>();
  for (const event of events) {
    const label = groupDateLabel(event.created_at);
    const group = groups.get(label);
    if (group) {
      group.push(event);
    } else {
      groups.set(label, [event]);
    }
  }
  return groups;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ActivityFeed() {
  const [selectedFilter, setSelectedFilter] = useState<EventFilter>("All");

  const { data: events } = useLiveQuery(
    (q) => {
      let query = q.from({ event: eventCollection });
      if (selectedFilter !== "All") {
        query = query.where(({ event }) =>
          inArray(event.type, [selectedFilter]),
        );
      }
      return query.orderBy(({ event }) => event.created_at, "desc");
    },
    [selectedFilter],
  );

  const grouped = groupByDay((events ?? []) as Event[]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Activity"
        subtitle="Recent events across your repositories"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-text-tertiary mr-1" />
          {EVENT_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              aria-pressed={selectedFilter === filter}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                selectedFilter === filter
                  ? "bg-accent-primary text-text-inverse"
                  : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80 hover:text-text-primary"
              }`}
            >
              {CHIP_LABELS[filter]}
            </button>
          ))}
        </div>

        {/* Content */}
        {grouped.size === 0 ? (
          <EmptyState
            icon={<Activity size={40} />}
            title="No activity found"
            description="There are no events matching the current filter. Try selecting a different event type or wait for new activity."
          />
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([label, dayEvents]) => (
              <section key={label}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-text-primary whitespace-nowrap">
                    {label}
                  </h2>
                  <div className="h-px flex-1 bg-border-primary" />
                  <span className="text-xs text-text-tertiary">
                    {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative ml-4 border-l-2 border-border-primary pl-6 space-y-1">
                  {dayEvents.map((event) => {
                    const meta = getEventMeta(event.type);
                    return (
                      <Card key={event.id} padding="sm" className="relative">
                        {/* Timeline dot */}
                        <span
                          className={`absolute -left-[calc(1.5rem+5px)] top-4 flex h-2.5 w-2.5 items-center justify-center rounded-full ring-2 ring-bg-primary ${meta.color} bg-current`}
                        />

                        <div className="flex items-start gap-3 group/event">
                          <Avatar
                            src={event.actor.avatar_url}
                            alt={event.actor.display_login}
                            size="sm"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-text-primary">
                                {event.actor.display_login}
                              </span>
                              <Badge variant={meta.badgeVariant}>
                                <span className={meta.color}>{meta.icon}</span>
                                {event.type.replace("Event", "")}
                              </Badge>
                            </div>

                            <p className="text-sm text-text-secondary mt-0.5">
                              {getEventDescription(event)}
                            </p>

                            <div className="flex items-center gap-3 mt-1.5 text-xs text-text-tertiary">
                              <span className="font-mono truncate max-w-[200px]">
                                {event.repo.name}
                              </span>
                              <span>&middot;</span>
                              <time dateTime={event.created_at}>
                                {timeAgo(event.created_at)}
                              </time>
                            </div>
                          </div>

                          <a
                            href={getEventUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View on GitHub`}
                            className="shrink-0 text-text-tertiary hover:text-text-primary opacity-0 group-hover/event:opacity-100 focus-visible:opacity-100 transition-opacity"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

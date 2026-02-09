import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Star,
  GitFork,
  CircleDot,
  GitPullRequest,
  Users,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { allReposByStars } from "@/queries/repositories";
import { allEvents } from "@/queries/events";
import { openIssues } from "@/queries/issues";
import { openPRs } from "@/queries/pull-requests";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { timeAgo, toISODay } from "@/lib/date";
import { getLanguageColor } from "@/lib/colors";
import { starRepoAction, unstarRepoAction } from "@/mutations/repositories";

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                  */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold text-text-primary">
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sparkline tooltip                                                          */
/* -------------------------------------------------------------------------- */

interface SparklinePayload {
  day: string;
  count: number;
}

function SparklineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SparklinePayload }>;
}) {
  if (!active || !payload?.length) return null;
  const { day, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-primary bg-bg-card px-3 py-1.5 shadow-sm">
      <p className="text-xs font-medium text-text-primary">
        {count} event{count !== 1 ? "s" : ""}
      </p>
      <p className="text-xs text-text-secondary">{day}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export function Dashboard() {
  /* -- Live queries -------------------------------------------------------- */

  const { data: repoRows } = useLiveQuery(allReposByStars, []);

  const { data: openIssueRows } = useLiveQuery(openIssues, []);

  const { data: openPrRows } = useLiveQuery(openPRs, []);

  const { data: eventRows } = useLiveQuery(allEvents, []);

  /* -- Derived data -------------------------------------------------------- */

  const repos = useMemo(() => repoRows ?? [], [repoRows]);
  const events = useMemo(() => eventRows ?? [], [eventRows]);

  const openIssueCount = (openIssueRows ?? []).length;
  const openPrCount = (openPrRows ?? []).length;

  const totalStars = useMemo(
    () => repos.reduce((sum, r) => sum + r.stargazers_count, 0),
    [repos],
  );

  const uniqueContributors = useMemo(() => {
    const logins = new Set<string>();
    for (const event of events) {
      logins.add(event.actor.login);
    }
    return logins.size;
  }, [events]);

  /* -- Sparkline data (last 14 days) -------------------------------------- */

  const sparklineData = useMemo(() => {
    const now = new Date();
    const days: { day: string; count: number }[] = [];

    // Build a map of day -> count from events
    const countByDay = new Map<string, number>();
    for (const event of events) {
      const day = toISODay(event.created_at);
      countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
    }

    // Generate last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toISODay(d);
      days.push({
        day: key,
        count: countByDay.get(key) ?? 0,
      });
    }

    return days;
  }, [events]);

  /* -- Render -------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Overview of your tracked repositories"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* ---- Stats row ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Open Issues"
            value={openIssueCount}
            icon={
              <CircleDot size={20} className="text-black dark:text-white" />
            }
            color="bg-black/5 dark:bg-white/5"
          />
          <StatCard
            label="Open PRs"
            value={openPrCount}
            icon={
              <GitPullRequest
                size={20}
                className="text-black dark:text-white"
              />
            }
            color="bg-black/5 dark:bg-white/5"
          />
          <StatCard
            label="Total Stars"
            value={totalStars}
            icon={<Star size={20} className="text-black dark:text-white" />}
            color="bg-black/5 dark:bg-white/5"
          />
          <StatCard
            label="Contributors"
            value={uniqueContributors}
            icon={<Users size={20} className="text-black dark:text-white" />}
            color="bg-black/5 dark:bg-white/5"
          />
        </div>

        {/* ---- Activity sparkline ---- */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-text-secondary" />
            <h2 className="text-sm font-medium text-text-primary">
              Activity — Last 14 Days
            </h2>
            <span className="ml-auto text-xs text-text-tertiary">
              {events.length} total event{events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient
                    id="sparklineGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-text-primary)"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-text-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.slice(5)} // "MM-DD"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<SparklineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-text-primary)"
                  strokeWidth={2}
                  fill="url(#sparklineGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ---- Repository grid ---- */}
        <div>
          <h2 className="text-sm font-medium text-text-primary mb-3">
            Tracked Repositories
          </h2>

          {repos.length === 0 ? (
            <Card padding="lg">
              <p className="text-sm text-text-secondary text-center">
                No repositories tracked yet. Add some from the setup page.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Repo card                                                                   */
/* -------------------------------------------------------------------------- */

interface RepoCardProps {
  repo: {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    updated_at: string;
    html_url: string;
    starred_by_me: boolean;
    owner: { login: string; avatar_url: string };
  };
}

function RepoCard({ repo }: RepoCardProps) {
  const langColor = getLanguageColor(repo.language);

  const handleStarToggle = () => {
    if (repo.starred_by_me) {
      unstarRepoAction({ repoId: repo.id, repoFullName: repo.full_name });
    } else {
      starRepoAction({ repoId: repo.id, repoFullName: repo.full_name });
    }
  };

  return (
    <Card hover padding="md" className="flex flex-col gap-3">
      {/* Header: name + external link */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {repo.name}
          </h3>
          <p className="text-xs text-text-tertiary truncate">
            {repo.full_name}
          </p>
        </div>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {repo.description}
        </p>
      )}

      {/* Language + stats */}
      <div className="flex items-center gap-3 flex-wrap mt-auto pt-1">
        {repo.language && (
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: langColor }}
            />
            {repo.language}
          </span>
        )}

        <button
          onClick={handleStarToggle}
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <Star
            size={12}
            className={
              repo.starred_by_me
                ? "fill-black text-black dark:fill-white dark:text-white"
                : ""
            }
          />
          {repo.stargazers_count.toLocaleString()}
        </button>

        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <GitFork size={12} />
          {repo.forks_count.toLocaleString()}
        </span>

        <Badge variant="info">
          <CircleDot size={10} />
          {repo.open_issues_count}
        </Badge>
      </div>

      {/* Last updated */}
      <div className="border-t border-border-primary pt-2">
        <time dateTime={repo.updated_at} className="text-xs text-text-tertiary">
          Updated {timeAgo(repo.updated_at)}
        </time>
      </div>
    </Card>
  );
}

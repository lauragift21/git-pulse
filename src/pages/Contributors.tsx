import { useMemo } from "react";
import { useLiveQuery, count } from "@tanstack/react-db";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  GitPullRequest,
  CircleDot,
  TrendingUp,
  Trophy,
  Crown,
  Medal,
} from "lucide-react";
import { parseISO, startOfWeek, format } from "date-fns";
import { pullRequestCollection } from "@/collections/pull-requests";
import { issueCollection } from "@/collections/issues";
import { eventCollection } from "@/collections/events";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ContributorStats {
  login: string;
  avatar_url: string;
  html_url: string;
  prCount: number;
  issueCount: number;
  total: number;
}

interface WeeklyDataPoint {
  week: string;
  contributions: number;
}

/* -------------------------------------------------------------------------- */
/*  Rank badge helper                                                          */
/* -------------------------------------------------------------------------- */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/10 dark:bg-white/10">
        <Crown size={14} className="text-black dark:text-white" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-400/15">
        <Medal size={14} className="text-neutral-500" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-300/15">
        <Medal size={14} className="text-neutral-400" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-bg-tertiary text-xs font-medium text-text-secondary">
      {rank}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                   */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg bg-opacity-15 ${accentClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom tooltip                                                              */
/* -------------------------------------------------------------------------- */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-primary bg-bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-primary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-text-secondary">
          {entry.name}:{" "}
          <span className="font-medium text-text-primary">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function Contributors() {
  /* ---- Live queries ---- */

  // All PRs — reactive data source
  const { data: prRows } = useLiveQuery((q) =>
    q.from({ pr: pullRequestCollection }),
  );

  // All issues — reactive data source
  const { data: issueRows } = useLiveQuery((q) =>
    q.from({ issue: issueCollection }),
  );

  // All events — for the timeline chart
  const { data: eventRows } = useLiveQuery((q) =>
    q.from({ event: eventCollection }),
  );

  // TanStack DB aggregate: count PRs using groupBy
  // This showcases the built-in count() aggregate function.
  // We group by a static expression since we just want the total count.
  const { data: prCountRows } = useLiveQuery(
    (q) =>
      q.from({ pr: pullRequestCollection }).select(({ pr }) => ({
        total: count(pr.id),
      })),
    [],
  );

  /* ---- Derived contributor stats ---- */

  const prs = useMemo(() => prRows ?? [], [prRows]);
  const issues = useMemo(() => issueRows ?? [], [issueRows]);
  const events = useMemo(() => eventRows ?? [], [eventRows]);

  // Aggregate PR count from TanStack DB query (showcases built-in aggregate)
  const aggregatedPrCount = prCountRows?.[0]?.total ?? 0;

  // Merge PRs + issues by contributor login
  const contributors: ContributorStats[] = useMemo(() => {
    const map = new Map<string, ContributorStats>();

    for (const pr of prs) {
      const login = pr.user.login;
      const existing = map.get(login);
      if (existing) {
        existing.prCount += 1;
        existing.total += 1;
      } else {
        map.set(login, {
          login,
          avatar_url: pr.user.avatar_url,
          html_url: pr.user.html_url,
          prCount: 1,
          issueCount: 0,
          total: 1,
        });
      }
    }

    for (const issue of issues) {
      const login = issue.user.login;
      const existing = map.get(login);
      if (existing) {
        existing.issueCount += 1;
        existing.total += 1;
      } else {
        map.set(login, {
          login,
          avatar_url: issue.user.avatar_url,
          html_url: issue.user.html_url,
          prCount: 0,
          issueCount: 1,
          total: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [prs, issues]);

  // Summary stats
  const totalContributors = contributors.length;
  const totalPRs = aggregatedPrCount || prs.length;
  const totalIssues = issues.length;
  const avgPrsPerContributor =
    totalContributors > 0 ? (prs.length / totalContributors).toFixed(1) : "0";

  // Top 10 by PR count for bar chart
  const topByPRs = useMemo(
    () =>
      [...contributors]
        .sort((a, b) => b.prCount - a.prCount)
        .slice(0, 10)
        .map((c) => ({ name: c.login, prs: c.prCount })),
    [contributors],
  );

  // Contributions over time (events grouped by week)
  const weeklyData: WeeklyDataPoint[] = useMemo(() => {
    const weekMap = new Map<string, number>();

    for (const event of events) {
      const date = parseISO(event.created_at);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStart, "MMM d");
      weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
    }

    // Sort chronologically by parsing dates back
    const entries = Array.from(weekMap.entries());
    entries.sort((a, b) => {
      // Simple string comparison works since all are from recent weeks
      return entries.indexOf(a) - entries.indexOf(b);
    });

    return entries.map(([week, contributions]) => ({ week, contributions }));
  }, [events]);

  /* ---- Render ---- */

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Contributors"
        subtitle="Contributor activity and statistics"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* ---- Summary stats row ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={20} className="text-blue-500" />}
            label="Total Contributors"
            value={totalContributors.toLocaleString()}
            accentClass="bg-blue-500/15"
          />
          <StatCard
            icon={<GitPullRequest size={20} className="text-purple-500" />}
            label="Total PRs"
            value={totalPRs.toLocaleString()}
            accentClass="bg-purple-500/15"
          />
          <StatCard
            icon={<CircleDot size={20} className="text-emerald-500" />}
            label="Total Issues"
            value={totalIssues.toLocaleString()}
            accentClass="bg-emerald-500/15"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-amber-500" />}
            label="Avg PRs / Contributor"
            value={avgPrsPerContributor}
            accentClass="bg-amber-500/15"
          />
        </div>

        {/* ---- Leaderboard ---- */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border-primary">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-text-primary">
              Contributor Leaderboard
            </h2>
            <span className="ml-auto rounded-full bg-bg-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
              {contributors.length}
            </span>
          </div>

          {contributors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <Users size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No contributor data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border-primary bg-bg-secondary">
                    <th className="w-16 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Rank
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Contributor
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      PRs
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Issues
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map((contributor, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={contributor.login}
                        className={`border-b border-border-primary last:border-b-0 transition-colors duration-100 ${
                          idx % 2 === 1 ? "bg-bg-secondary/50" : "bg-bg-card"
                        } hover:bg-bg-hover`}
                      >
                        <td className="px-4 py-3">
                          <RankBadge rank={rank} />
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={contributor.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 group"
                          >
                            <Avatar
                              src={contributor.avatar_url}
                              alt={contributor.login}
                              size="md"
                            />
                            <span className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                              {contributor.login}
                            </span>
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="purple">
                            <GitPullRequest size={12} />
                            {contributor.prCount}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="success">
                            <CircleDot size={12} />
                            {contributor.issueCount}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-bg-tertiary px-2 py-0.5 text-xs font-semibold text-text-primary">
                            {contributor.total}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ---- Charts ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart: Top 10 by PR count */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <GitPullRequest size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Top Contributors by PRs
              </h3>
            </div>
            {topByPRs.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-text-tertiary text-sm">
                No PR data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={topByPRs}
                  margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-primary)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                    axisLine={{ stroke: "var(--color-border-primary)" }}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="prs"
                    name="Pull Requests"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Area chart: Contributions over time */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Contributions Over Time
              </h3>
            </div>
            {weeklyData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-text-tertiary text-sm">
                No event data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="contributionGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-primary)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                    axisLine={{ stroke: "var(--color-border-primary)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    name="Contributions"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#contributionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

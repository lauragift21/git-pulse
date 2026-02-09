import { githubFetch } from "./client";

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    display_login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: Record<string, unknown>;
  public: boolean;
  created_at: string;
}

interface CompareResponse {
  total_commits: number;
}

/**
 * Enrich PushEvent payloads with commit counts using the Compare API.
 * Uses `before...head` SHAs already present in the payload.
 * Fails silently — events without enrichment just won't show a count.
 */
async function enrichPushEvents(events: GitHubEvent[]): Promise<GitHubEvent[]> {
  const pushEvents = events.filter(
    (e) => e.type === "PushEvent" && e.payload.before && e.payload.head,
  );

  if (pushEvents.length === 0) return events;

  // Fetch commit counts in parallel (with per_page=1 to minimize response size)
  const enrichResults = await Promise.allSettled(
    pushEvents.map((e) =>
      githubFetch<CompareResponse>(
        `/repos/${e.repo.name}/compare/${e.payload.before}...${e.payload.head}`,
        { params: { per_page: 1 } },
      ),
    ),
  );

  // Inject the count back into the payload
  pushEvents.forEach((e, i) => {
    const result = enrichResults[i];
    if (result.status === "fulfilled") {
      e.payload.size = result.value.total_commits;
    }
  });

  return events;
}

/**
 * Fetch events for a single repo, paginating up to `maxPages` pages
 * (100 events per page). Stops early if the oldest event on a page
 * is older than 14 days, since that's the chart window.
 */
export async function fetchRepoEvents(
  fullName: string,
  maxPages = 3,
): Promise<GitHubEvent[]> {
  const allEvents: GitHubEvent[] = [];
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

  for (let page = 1; page <= maxPages; page++) {
    const events = await githubFetch<GitHubEvent[]>(
      `/repos/${fullName}/events`,
      { params: { per_page: 100, page } },
    );

    if (events.length === 0) break;

    allEvents.push(...events);

    // Stop paginating once we've reached events older than 14 days
    const oldest = events[events.length - 1];
    if (oldest && new Date(oldest.created_at).getTime() < cutoff) break;

    // GitHub caps at 10 pages / 300 events; stop if we got a short page
    if (events.length < 100) break;
  }

  // Enrich PushEvents with commit counts from the Compare API
  return enrichPushEvents(allEvents);
}

export async function fetchAllEvents(
  repoFullNames: string[],
): Promise<GitHubEvent[]> {
  const results = await Promise.allSettled(
    repoFullNames.map((name) => fetchRepoEvents(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubEvent[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r) => r.value)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export async function fetchUserInfo(): Promise<{
  login: string;
  avatar_url: string;
  name: string | null;
  id: number;
  html_url: string;
}> {
  return githubFetch("/user");
}

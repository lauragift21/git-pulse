## GitPulse

**GitPulse** is a GitHub Activity Dashboard built with **React 19** and **TanStack DB**. It lets you authenticate with a GitHub Personal Access Token (PAT), track specific repositories, and view all activity in a unified dashboard.

---

### Tech Stack

- **React 19** + **Vite 7** + **TypeScript** (strict mode)
- **TanStack DB** (`@tanstack/react-db`) - client-side reactive data store
- **TanStack Query** + `@tanstack/query-db-collection` - data fetching bridge
- **Zod v4** - schema validation
- **Tailwind CSS v4** - styling (monochromatic black/white theme with dark mode)
- **Recharts** - charts, **lucide-react** - icons, **date-fns** - dates

---

### Architecture (Data Flow)

```
GitHub REST API
      ↓
TanStack Query (fetch + cache)
      ↓
queryCollectionOptions() bridge
      ↓
TanStack DB Collections (single source of truth)
      ↓
useLiveQuery() (reactive reads in components)
```

The key principle: **all UI reads go through TanStack DB live queries, never directly from the Query cache.**

---

### Source Structure

| Directory          | Purpose                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `src/schemas/`     | Zod schemas for all entities (Repository, Issue, PullRequest, Event, Label, User)           |
| `src/collections/` | TanStack DB collection definitions - one per entity, bridged via `queryCollectionOptions()` |
| `src/api/`         | GitHub REST API client (`client.ts` handles auth, rate limiting, errors) + endpoint modules |
| `src/pages/`       | 6 pages: Setup, Dashboard, ActivityFeed, Issues, PullRequests, Contributors                 |
| `src/components/`  | Layout (AppShell, Sidebar, Header) + UI primitives (Button, Card, Badge, Avatar, etc.)      |
| `src/hooks/`       | `useGitHubToken`, `useTrackedRepos`, `useDarkMode`                                          |
| `src/lib/`         | Utilities for query client config, token management, color contrast, date formatting        |

---

### Key Patterns

1. **Resilient multi-repo fetching** - All `fetchAll*()` functions use `Promise.allSettled` so one repo's failure doesn't break others.

2. **Live queries with reactive deps** - Filters, sorts, and search terms are passed as the second argument to `useLiveQuery`, making the UI automatically re-render when state changes.

3. **Simple SPA routing** - A `useState<Page>` in `App.tsx` drives navigation, no URL router.

4. **Stale time strategy** - Labels (10min) > Repos (5min) > Issues/PRs (3min) > Events (2min), reflecting how often each entity changes.

5. **Theming** - CSS custom properties in `globals.css` with a `.dark` class override and Tailwind's `dark:` variant. The design is intentionally monochromatic (black/white).

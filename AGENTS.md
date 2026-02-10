# GitPulse - Project Rules

These rules apply to all coding sessions in the GitPulse project.

## Project Overview

GitPulse is a GitHub Activity Dashboard built with React + TanStack DB. It showcases
TanStack DB's realtime features: collections, live queries (filters, joins, sorts,
aggregates), and reactive UI updates.

## Architecture

- **Data layer**: TanStack DB collections are the single source of truth
- **Fetching**: TanStack Query + @tanstack/query-db-collection bridges API data into collections
- **Queries**: All UI reads go through `useLiveQuery` / `useLiveSuspenseQuery` — never read from Query cache directly
- **Routing**: Simple state-based SPA page switching (no URL router)

## Code Conventions

### Collections

- Define all collections in `src/collections/` — one file per entity
- Every collection must have a Zod schema in `src/schemas/`
- Use `queryCollectionOptions()` to bridge TanStack Query into TanStack DB
- Always provide `getKey`, `schema`, and `sync` config
- Prefer `syncMode: 'eager'` for small datasets (<10k), `'on-demand'` for large

### Live Queries

- Place reusable query definitions in `src/queries/`
- Import operators (`eq`, `gt`, `and`, `or`, `count`, etc.) from `@tanstack/react-db`
- Always pass reactive dependencies as the second argument to `useLiveQuery`
- Use `useLiveSuspenseQuery` inside Suspense boundaries for initial loads only

### API Layer

- All GitHub API functions go in `src/api/`
- Use native `fetch` with the stored PAT as Bearer token
- Handle rate limiting (check `X-RateLimit-Remaining` header)
- Never store tokens in code — only in localStorage

### Components

- Page components go in `src/pages/`
- Reusable UI primitives go in `src/components/ui/`
- Feature-specific components go in `src/components/<feature>/`
- Use Tailwind CSS v4 utility classes — avoid inline styles
- Prefer composition over prop-heavy components

### Styling

- Use Tailwind CSS v4 with `@import "tailwindcss"` in globals.css
- Support dark mode via Tailwind `dark:` variant with class strategy
- Use CSS custom properties for theme colors defined in globals.css
- Label colors from GitHub should be rendered with inline background-color

### TypeScript

- Strict mode enabled
- Infer collection types from Zod schemas — don't duplicate type definitions
- Use `z.infer<typeof schema>` for derived types
- Prefer `const` assertions for static config objects

## File Structure

- `src/collections/` — TanStack DB collection definitions
- `src/schemas/` — Zod schemas for all entities
- `src/queries/` — Reusable live query definitions
- `src/api/` — GitHub REST API client and endpoint functions
- `src/pages/` — Top-level page components
- `src/components/` — UI components organized by feature
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utility functions (dates, colors, token management)

## Dependencies

Key packages (do not add alternatives without reason):

- `@tanstack/react-db` — Client-side reactive data store
- `@tanstack/react-query` + `@tanstack/query-db-collection` — Data fetching bridge
- `zod` — Schema validation
- `recharts` — Charts
- `lucide-react` — Icons
- `date-fns` — Date formatting

## Testing

- Run `npm run build` to verify TypeScript compilation
- Run `npm run dev` to test locally
- Test with invalid/expired token to verify error handling

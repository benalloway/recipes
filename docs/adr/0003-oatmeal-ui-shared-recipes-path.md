# ADR 0003 — Oatmeal reskin on @benalloway/ui, served under /recipes

Date: 2026-10-15
Status: accepted (supersedes ADR-0002 Cardstock visuals; form behavior,
schema, auth, and milestones untouched)

## Context

`benalloway.com` now speaks Oatmeal olive-instrument (ADR-0004 in
`benalloway-dot-com`). The recipes app should feel like the same brand, share
one component source of truth, and live at `benalloway.com/recipes/*` instead
of only `recipes.benalloway.com`.

## Decision

- **Visuals:** reskin to Oatmeal olive-instrument (olive tokens, Instrument
  Serif display + Inter, rounded-full pill buttons, tonal badges/surfaces,
  sticky olive navbar, full-screen olive mobile menu, dark mode with toggle).
  Preflight is now ON (full `tailwindcss` import) — the old preflight-off
  base is gone with Cardstock. Form behavior is unchanged: server re-renders
  with values + inline errors, `?error=` codes only for deep-linkable GETs.
- **Shared system:** UI primitives live in `benalloway/ui` (`@benalloway/ui`
  v0.1.0, pinned in `scripts/ui-version.txt`) and are **vendored** into
  `src/components/ui/` + `src/styles/global.css` via `scripts/sync-ui.sh`.
  App-specific shells (nav with auth state, RecipeCard/Grid, Plate, TagChip,
  RecipeForm, islands) stay in this repo and compose the vendored atoms.
- **Serving:** Astro `base: '/recipes'`; every app-absolute URL goes through
  `src/lib/base.ts` `u()`. Wrangler claims `benalloway.com/recipes*`
  (path route wins over the dot-com apex route by specificity) and keeps the
  subdomain custom domain during transition. Canonical home is
  `benalloway.com/recipes/*`; `recipes.benalloway.com/*` 301s there via a
  zone redirect rule.
- **No resource route may start with the base segment.** Astro 7 strips
  `base` twice at runtime when the stripped remainder itself starts with
  the base (`/recipes/recipes/new` → `/recipes/new` → `/new` → 404 in
  production builds; dev unaffected). Resource routes therefore live at
  singular `/recipe/*` (`/recipe/new`, `/recipe/[id]`, `/recipe/[id]/edit`,
  `/recipe/[id]/favorite`, `/recipe/[id]/delete`), and `astro.config`
  `redirects` map the old nested paths forward so pre-rename bookmarks keep
  working through the path-preserving subdomain→apex 301.

## Consequences

- Magic links build from `origin + u('/auth/verify')`; session cookie path
  is scoped to the base (`u('/')`); middleware strips the base before
  open-path checks.
- Bumping the design system = update the SHA + run `scripts/sync-ui.sh`.

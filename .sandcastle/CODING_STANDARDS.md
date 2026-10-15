# Coding Standards

<!-- The reviewer agent loads this during code review via @.sandcastle/CODING_STANDARDS.md
     so these standards are enforced during review without costing tokens during implementation. -->

## Style (Oatmeal on @benalloway/ui — see docs/adr/0003-oatmeal-ui-shared-recipes-path.md)

- Astro 7 SSR + `@astrojs/cloudflare`. Zero client framework — interactive bits
  are plain TS islands, everything else server-rendered HTML.
- Tailwind CSS v4 with Oatmeal olive-instrument tokens (vendored
  `src/styles/global.css` from `@benalloway/ui`, pinned in
  `scripts/ui-version.txt`; re-vendor via `scripts/sync-ui.sh`, never
  hand-edit vendored files). Preflight is ON. Do not introduce new colors,
  fonts, or shadows without a new ADR.
- Type: Instrument Serif display for headings/titles, Inter for UI/body.
- Plates: user photos in restrained rounded frames with fixed aspect ratios —
  never unbounded `w-full` heights, never hero banners. Meaningful `alt`
  (recipe title);
  decorative thumbs `alt=""`.
- Shell: global nav lives in `Base` (Recipes / Favorites / New). Every
  surface links its entry points (edit link on detail, login CTA when
  logged out). Real empty states everywhere; never stale copy, never dead ends.
- Forms: server re-renders with submitted values + inline errors (never wipe
  input on validation failure). Dynamic ingredient rows via a plain-TS island.
  Sticky submit on mobile. Keep `?error=` codes only for deep-linkable cases.

## Testing

- Run `npm run check` (`astro sync && tsc --noEmit`) and `npm run build`
  (`astro build`) until green before committing. Never weaken types or config
  to silence errors.
- This repo has no `typecheck`/`test` scripts: use `check` + `build` as the
  feedback loops wherever prompts say `typecheck`/`test`.
- Verify visual work with `npm run preview` + `curl` (Origin header for POSTs)
  per the ticket's acceptance list.

## Architecture

- **Portability boundary:** only `src/lib/runtime.ts`, `src/lib/adapters/*`
  (db / blobs / mail), and `src/env.d.ts` may import platform modules or
  platform types. App code never does.
- Runtime config comes from Worker env bindings
  (`import { env } from 'cloudflare:workers'`) — never `process.env` in `src/`.
- Migrations are plain-SQLite SQL in `migrations/` (portable, no D1-only
  syntax). Ingredients are relational rows; steps/security prose stays JSON.
- Any change to live behavior (schema, deploy config, worker behavior) adds a
  `CHANGES.md` entry (Change / Verify / Rollback) in the same branch.

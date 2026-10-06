# Coding Standards

<!-- The reviewer agent loads this during code review via @.sandcastle/CODING_STANDARDS.md
     so these standards are enforced during review without costing tokens during implementation. -->

## Style (Cardstock — see docs/adr/0002-cardstock-design-language.md)

- Astro 7 SSR + `@astrojs/cloudflare`. Zero client framework — interactive bits
  are plain TS islands, everything else server-rendered HTML.
- Tailwind CSS v4 (CSS-first config) with tokens in `@theme` in
  `src/styles/global.css`: paper `#FAF7F0` (page), card `#FFFDF8` (surfaces),
  rule `#E5DCC9` (hairlines, warmed), ink `#201A15`, muted `#8A7F72`,
  accent paprika `#B4432A` (links/focus/active only). Style with utilities
  (`bg-bg`, `bg-surface`, `border-hairline`, `text-ink`, `text-muted`,
  `text-accent`, ...). Sharp corners only (≤2px radius). Do not introduce new
  colors, fonts, shadows, or animation beyond the tokens without a new ADR.
  Preflight is intentionally off — do not enable it without an explicit
  design decision.
- Type: grotesk micro-labels for structure (existing Helvetica stack, 10px
  letterspaced uppercase); a serif with character for recipe titles; one
  handwriting face for marginalia only (edit notes, personal asides — never
  body copy or labels).
- Plates, not heroes: user photos get a warm duotone/tint overlay at low
  opacity inside restrained frames with fixed aspect ratios — never unbounded
  `w-full` heights, never hero banners. Meaningful `alt` (recipe title);
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

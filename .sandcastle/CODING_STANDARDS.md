# Coding Standards

<!-- The reviewer agent loads this during code review via @.sandcastle/CODING_STANDARDS.md
     so these standards are enforced during review without costing tokens during implementation. -->

## Style

- Astro 7 SSR + `@astrojs/cloudflare`. Zero client framework — interactive bits
  are plain TS islands, everything else server-rendered HTML.
- Tailwind CSS v4 (CSS-first config) with tokens in `@theme` in
  `src/styles/global.css` (bone white `#FBFBF9`, hairline `#E3E3E0`, ink
  `#1A1A1A`, muted `#8A8A86`, accent `#9A8C7C`). Style with utilities
  (`bg-bg`, `text-ink`, `border-hairline`, `text-accent`, ...). Do not introduce
  new colors, fonts, shadows, or animation beyond the tokens. Preflight is
  intentionally off — do not enable it without an explicit design decision.

## Testing

- Run `npm run check` (`astro sync && tsc --noEmit`) and `npm run build`
  (`astro build`) until green before committing. Never weaken types or config
  to silence errors.
- This repo has no `typecheck`/`test` scripts: use `check` + `build` as the
  feedback loops wherever prompts say `typecheck`/`test`.

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

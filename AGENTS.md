# AGENTS.md — ground rules for AI agents working in this repo

Purpose: any agent can pick up a `ready-for-agent` issue and ship a
reviewable PR without hand-holding. Non-negotiable rules first, context after.

## Source of truth

- `PLAN.md` — architecture, schema, milestones, design language. Do not edit
  milestone definitions without discussing with the owner.
- GitHub issues are the unit of work: **one issue → one branch → one PR.**
  Never bundle unrelated issues.

## Stack invariants (do not violate)

- Astro 7 SSR + `@astrojs/cloudflare`. Zero client framework — interactive bits
  are plain TS islands, everything else server-rendered HTML.
- **Portability boundary:** only `src/lib/runtime.ts`, `src/lib/adapters/*`
  (db / blobs / mail), and `src/env.d.ts` may import platform modules or
  platform types. App code never does.
- Runtime config comes from Worker env bindings
  (`import { env } from 'cloudflare:workers'`) — **never `process.env`**.
  Secrets: `.dev.vars` (gitignored) locally, `wrangler secret put` in prod.
- Migrations are plain-SQLite SQL in `migrations/` (portable, no D1-only
  syntax). Ingredients are relational rows; steps/security prose stays JSON.
- Design system is fixed: tokens live in `src/styles/global.css`
  (bone white, hairlines, single accent). Do not introduce new colors, fonts,
  shadows, or animation beyond the tokens.

## Commands

```sh
npm run dev                 # astro dev (bindings via wrangler.jsonc platformProxy)
npm run check               # astro sync && tsc --noEmit  — run before every PR
npm run build               # astro build
npm run preview             # wrangler dev against built bundle
npm run deploy              # build + wrangler deploy (production!) — see Deploy policy
npm run db:migrate:local    # D1 migrations to local miniflare sqlite
npm run db:migrate:remote   # D1 migrations to production recipes-db
```

M1 will add `migrations/0001_*.sql` and `scripts/seed.mjs` (plus
`db:seed:local/remote` scripts). Until then, don't invent seeds.

## Workflow (labels drive everything)

- **Work lane:** pick only issues labeled `ready-for-agent`. Stay inside the
  issue body; scope-creep goes in a comment, not the PR.
- Lanes you do not work: `needs-triage`, `ready-for-human`
  (owner-only actions), `blocked-external` (Cloudflare dashboard / Resend DNS).
- Branch naming: `feat/mN-short-desc` or `fix/short-desc`.
- Before pushing: `npm run check` + `npm run build` green. CI re-verifies
  (.github/workflows/ci.yml) — a red CI blocks the review.
- PRs: base `main`, label `ai-drafted-feedback` + the issue's milestone number,
  and include: issue reference, what/why, verification commands + output, and
  an explicit **Human gates** section whenever anything needs the owner
  (dashboard actions, credentials, DNS).
- Post progress comments on the issue as you go; close issues you actually
  finished closing PRs reference (`Closes #N`).

## Deploy policy

- Merges to `main` automatically deploy to production: the Actions deploy job
  runs remote D1 migrations, then `npm run deploy`. Treat every merge as a
  release — nothing half-finished goes into `main`.
- Manual `npm run deploy` / `db:migrate:remote` are production actions: only run
  them when the issue or the owner explicitly authorizes it in-conversation.
- Any PR that changes what's live (schema, deploy config, worker behavior)
  must add an entry to `CHANGES.md` (Change / Verify / Rollback) in the same PR.
- Deploys require an authenticated wrangler/cf session owned by the human.
  Agents must never handle, read, or echo raw API tokens; never read
  `~/.config/cloudflare/` or `.dev.vars`.

## Misc

- Code comments only where non-obvious. Match existing style.
- License is `UNLICENSED` while private; the fork story (see PLAN.md) decides
  the license later.

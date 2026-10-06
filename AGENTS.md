# AGENTS.md — ground rules for AI agents working in this repo

Purpose: any agent running inside Sandcastle can pick up a `ready-for-agent`
issue and ship commits without hand-holding. Non-negotiable rules first,
context after. 1:1 with `mattpocock/skills` + `mattpocock/sandcastle`
(`parallel-planner-with-review`); app specifics live in `PLAN.md`,
`GLOSSARY.md`, and `.sandcastle/CODING_STANDARDS.md`.

## Source of truth

- `PLAN.md` — architecture, schema, milestones, design language. Do not edit
  milestone definitions without discussing with the owner.
- GitHub issues are the unit of work. The `Sandcastle` label marks the backlog
  the planner reads; triage roles (`needs-triage` → `ready-for-agent` /
  `ready-for-human`) decide what is agent-ready.
- `CONTRIBUTING.md` — human-side flow (idea → triage → Sandcastle → merge).
  `.github/workflows/README.md` — workflow map (CI only; agents run local).
- `GLOSSARY.md` + `docs/adr/` — domain vocabulary and decisions. Use glossary
  terms verbatim; flag ADR conflicts explicitly.

## Stack invariants (do not violate)

- Astro 7 SSR + `@astrojs/cloudflare`. Zero client framework — interactive bits
  are plain TS islands, everything else server-rendered HTML.
- **Portability boundary:** only `src/lib/runtime.ts`, `src/lib/adapters/*`
  (db / blobs / mail), and `src/env.d.ts` may import platform modules or
  platform types. App code never does.
- Runtime config comes from Worker env bindings
  (`import { env } from 'cloudflare:workers'`) — **never `process.env`**.
  Secrets: `.dev.vars` (gitignored) locally, `wrangler secret put` in prod.
  Sandcastle secrets live in `.sandcastle/.env` (gitignored):
  `OPENCODE_API_KEY` + `GH_TOKEN` (fine-grained PAT: Issues RW, Metadata R —
  the sandbox's `gh` uses it to read/close issues). Never add Cloudflare
  account IDs or session keys.
- Migrations are plain-SQLite SQL in `migrations/` (portable, no D1-only
  syntax). Ingredients are relational rows; steps/security prose stays JSON.
- Design system is fixed: Tailwind CSS v4 (CSS-first config) with tokens
  in `@theme` in `src/styles/global.css` (bone white, hairlines, single
  accent) generating utilities (`bg-bg`, `text-ink`, `border-hairline`,
  `text-accent`, ...). Style with those utilities; keep base element styles
  in `@layer base`. Do not introduce new colors, fonts, shadows, or animation
  beyond the tokens. Preflight is intentionally off (see `global.css` header)
  — do not enable it without an explicit design decision.

## Commands

```sh
npm run dev                 # astro dev (bindings via wrangler.jsonc platformProxy)
npm run check               # astro sync && tsc --noEmit  — feedback loop before every commit
npm run build               # astro build
npm run preview             # wrangler dev against built bundle
npm run deploy              # build + wrangler deploy (production!) — see Deploy policy
npm run db:migrate:local    # D1 migrations to local miniflare sqlite
npm run db:migrate:remote   # D1 migrations to production recipes-db
npm run sandcastle          # local AFK factory: planner → implementers → reviewers → merger
```

Seeds are static, idempotent SQL (`scripts/seed.sql`, INSERT OR IGNORE) —
run via `db:seed:local` / `db:seed:remote`. Don't add ad-hoc seed data.

This repo has no `typecheck`/`test` scripts: wherever a Sandcastle prompt says
`typecheck`/`test`, run `npm run check` + `npm run build` instead.

## Local D1 (acceptance fixtures)

- `wrangler d1 execute --local` and `wrangler dev` share the same local D1
  file — if a query looks wrong, suspect your SQL (ids, WHERE range) before
  suspecting the channel. The dev DB is long-lived shared state across
  sessions: other agents' fixture rows may already exist.
- Fixture discipline: fixed ids, `DELETE`s first (re-runnable), then
  SELECT-back to confirm what actually landed — never assume.
- `npm run preview` serves the last `npm run build` output: **rebuild
  before previewing**, or you test stale code.
- `curl` POSTs need `-H "Origin: <preview-url>"` (Astro's CSRF check 403s
  headerless posts; real browser forms send it).

## Workflow — Sandcastle AFK factory (fully local)

Nothing agent-driven runs in GitHub Actions. The owner runs the factory on
their machine; sandboxes never see credentials (host `gh` auth does all
GitHub operations outside the sandbox where needed, the merger closes issues
from inside via the sandbox `gh` CLI).

0. **Backlog:** issues carrying the `Sandcastle` label are the planner's input.
   Triage (`/triage`) moves specs through `needs-triage` → `needs-info` /
   `ready-for-agent` / `ready-for-human` / `wontfix` with `bug`/`enhancement`.
   Only `ready-for-agent` + `Sandcastle` issues get planned.
1. **Run:** `cp .sandcastle/.env.example .sandcastle/.env` (fill
   `OPENCODE_API_KEY` once), build the image once
   (`npx @ai-hero/sandcastle docker build-image` or
   `docker build -t sandcastle:recipes .sandcastle/`), then
   `npm run sandcastle` from the branch you want merged into
   (usually `main`).
2. **What happens:** up to 10 plan → execute → merge cycles. The planner
   emits `<plan>` JSON with unblocked issues and deterministic
   `sandcastle/issue-{id}` branches. Each issue gets its own sandbox:
   implementer (RGR, commits with `RALPH:` prefix) then reviewer (same
   sandbox, same branch, per `.sandcastle/CODING_STANDARDS.md`). The merger
   merges completed branches into the current branch, runs verification,
   and closes their issues (`Completed by Sandcastle`).
3. **Work rules inside a sandbox:** change only what the issue scopes. Small
   commits, imperative messages. Obey the portability boundary, Worker env
   bindings, plain-SQLite migrations, and Tailwind tokens. `npm run check` +
   `npm run build` green before finishing. Add the `CHANGES.md` entry (Change
   / Verify / Rollback) when production behavior changes. Output
   `<promise>COMPLETE</promise>` when done. Never read or echo secrets.
4. **After a run:** review the merged result (`git log`, `npm run check` +
   `npm run build`, `npm run preview` smoke). Push when happy. Merges to
   `main` deploy to production via CI — acceptable pre-launch; tell the owner
   before pushing `main` if that ever needs a gate.

## Deploy policy

- Merges to `main` automatically deploy to production: the Actions deploy job
  runs remote D1 migrations, then `npm run deploy`. Treat every merge as a
  release — nothing half-finished goes into `main`.
- Manual `npm run deploy` / `db:migrate:remote` are production actions: only run
  them when the issue or the owner explicitly authorizes it in-conversation.
- Any branch that changes what's live (schema, deploy config, worker behavior)
  must add an entry to `CHANGES.md` (Change / Verify / Rollback) in the same branch.
- Deploys require an authenticated wrangler/cf session owned by the human.
  Agents must never handle, read, or echo raw API tokens; never read
  `~/.config/cloudflare/` or `.dev.vars`.

## Agent skills

Project skills live in `.agents/skills/` (Pocock set, pinned in
`skills-lock.json`; update with `npx skills update`). Before plan/spec work,
read `GLOSSARY.md` (vocabulary), `docs/adr/` (decisions touching your area),
`docs/agents/issue-tracker.md` (GitHub tracker conventions),
and `docs/agents/triage-labels.md` (the five canonical roles). Useful skills:
`to-spec` (synthesize the conversation into a spec), `to-tickets` (vertical
slices with blocking edges), `grill-with-docs` (plan sessions that sharpen
`GLOSSARY.md`/ADRs), `triage` (label state machine + agent briefs),
`implement` (build with `/tdd`, close out with `/code-review`),
`implement-spec` (integration branch + frontier subagents + merger),
`wayfinder` (multi-session decision maps), `diagnosing-bugs` (hard-bug loop),
`code-review` (Standards × Spec), `retro` (post-session env feedback).

## Misc

- Code comments only where non-obvious. Match existing style.
- License is `UNLICENSED` while private; the fork story (see PLAN.md) decides
  the license later.

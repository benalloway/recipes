# AGENTS.md — ground rules for AI agents working in this repo

Purpose: any agent running inside Forge can pick up a `ready-for-agent`
issue and ship commits without hand-holding. Non-negotiable rules first,
context after. 1:1 with `mattpocock/skills`
(`parallel-planner-with-review`); the factory is Forge
(`benalloway/forge@v1`, built on `@ai-hero/sandcastle`); app specifics live
in `PLAN.md`, `GLOSSARY.md`, and `.sandcastle/CODING_STANDARDS.md`.

## Source of truth

- `PLAN.md` — architecture, schema, milestones, design language. Do not edit
  milestone definitions without discussing with the owner.
- GitHub issues are the unit of work. The `Forge` label marks the backlog
  the planner reads; triage roles (`needs-triage` → `ready-for-agent` /
  `ready-for-human`) decide what is agent-ready.
- `CONTRIBUTING.md` — human-side flow (idea → triage → Forge → merge).
  `.github/workflows/README.md` — workflow map (`ci.yml` + `forge.yml`).
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
   Forge secrets are repo Actions secrets (`OPENCODE_API_KEY` +
   `FORGE_GH_TOKEN`); local `npm run forge` uses host `opencode` + `gh`
   auth. Never add Cloudflare account IDs or session keys.
- Migrations are plain-SQLite SQL in `migrations/` (portable, no D1-only
  syntax). Ingredients are relational rows; steps/security prose stays JSON.
- Design system is fixed: Oatmeal olive-instrument on `@benalloway/ui`
  (vendored `src/components/ui/` + `src/styles/global.css`, pinned in
  `scripts/ui-version.txt`; bump via `scripts/sync-ui.sh`, never hand-edit
  vendored files). App shells compose the vendored atoms. Do not introduce
  new colors, fonts, or shadows without a new ADR.
- Served at the subdomain root on `recipes.benalloway.com` (no Astro
  `base`) — every app-absolute URL goes through `src/lib/base.ts` `u()`
  (identity).

## Commands

```sh
npm run dev                 # astro dev (bindings via wrangler.jsonc platformProxy)
npm run check               # astro sync && tsc --noEmit  — feedback loop before every commit
npm run build               # astro build
npm run preview             # wrangler dev against built bundle
npm run deploy              # build + wrangler deploy (production!) — see Deploy policy
npm run db:migrate:local    # D1 migrations to local miniflare sqlite
npm run db:migrate:remote   # D1 migrations to production recipes-db
npm run forge               # local AFK factory: planner → implementers → reviewers → merger
npm run forge:gh            # trigger the Forge factory on GitHub Actions (wrapper default delivery)
npm run forge:gh:pr         # trigger the Forge factory with explicit PR delivery (safe default)
```

Seeds are static, idempotent SQL (`scripts/seed.sql`, INSERT OR IGNORE) —
run via `db:seed:local` / `db:seed:remote`. Don't add ad-hoc seed data.

This repo has no `typecheck`/`test` scripts: wherever a Forge prompt says
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

## Workflow — Forge AFK factory (Docker-free local + GitHub Actions)

Forge runs without Docker by default (`noSandbox()` + native git worktrees
under `.sandcastle/worktrees/`) both locally on your machine and in GitHub
Actions (`.github/workflows/forge.yml`). The factory is vendored from
`benalloway/forge@v1` into `.forge/` (`scripts/sync-forge.sh` +
`scripts/forge-version.txt`) — never hand-edit `.forge/`, improve upstream
and re-vendor.

0. **Backlog:** issues carrying the `Forge` label are the planner's input.
   Triage (`/triage`) moves specs through `needs-triage` → `needs-info` /
   `ready-for-agent` / `ready-for-human` / `wontfix` with `bug`/`enhancement`.
   Only `ready-for-agent` + `Forge` issues get planned. Triage also sets
   routing (`docs/agents/triage-labels.md`): no routing label (or
   `run:cloud`) runs on cloud Actions; `run:home` runs on the home server
   (`thinkcentre-m73`) and is skipped by cloud. A local `npm run forge`
   plans whatever is unblocked in the backlog label regardless of routing —
   coordinate via the issue comments before running it against a shared repo.
1. **Run locally:** `npm run forge` from the branch you want merged into
   (usually `main`). Uses host `opencode` + `gh` auth and creates an
   isolated git worktree per issue.
2. **Run on GitHub Actions:** label an issue `Forge` + `ready-for-agent` (no
   `run:home` label), or
   run `npm run forge:gh` / `npm run forge:gh:pr`. Needs `OPENCODE_API_KEY`
   (+ `FORGE_GH_TOKEN` for reliable PR delivery) as repo Actions secrets.
3. **What happens:** up to `FORGE_MAX_ITERATIONS` plan → execute → merge
   cycles. The planner emits `<plan>` JSON with unblocked issues and
   deterministic `forge/issue-{id}` branches. Each issue gets its own git
   worktree sandbox: implementer (RGR) then reviewer (same worktree, same
   branch, per `.sandcastle/CODING_STANDARDS.md`). The merger merges
   completed branches, runs verification, delivers (PR by default; `push`
   only where the wrapper enables it), and closes their issues
   (`Completed by Forge`).
4. **Work rules inside a sandbox:** change only what the issue scopes. Small
   commits, imperative messages. Obey the portability boundary, Worker env
   bindings, plain-SQLite migrations, and Tailwind tokens. `npm run check` +
   `npm run build` green before finishing. Add the `CHANGES.md` entry (Change
   / Verify / Rollback) when production behavior changes. Output
   `<promise>COMPLETE</promise>` when done. Never read or echo secrets.
5. **After a run:** review the merged result (`git log`, `npm run check` +
   `npm run build`, `npm run preview` smoke). Merges to `main` deploy to
   production via CI — acceptable pre-launch; tell the owner before pushing
   `main` if that ever needs a gate.

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

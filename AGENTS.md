# AGENTS.md — ground rules for AI agents working in this repo

Purpose: any agent can pick up a `ready-for-agent` issue and ship a
reviewable PR without hand-holding. Non-negotiable rules first, context after.

## Source of truth

- `PLAN.md` — architecture, schema, milestones, design language. Do not edit
  milestone definitions without discussing with the owner.
- GitHub issues are the unit of work: **one issue → one branch → one PR.**
  Never bundle unrelated issues.
- `CONTRIBUTING.md` — human-side flow (idea → triage → merge) and the
  `ready-for-agent` triage bar. `.github/workflows/README.md` — workflow map.

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
npm run check               # astro sync && tsc --noEmit  — run before every PR
npm run build               # astro build
npm run preview             # wrangler dev against built bundle
npm run deploy              # build + wrangler deploy (production!) — see Deploy policy
npm run db:migrate:local    # D1 migrations to local miniflare sqlite
npm run db:migrate:remote   # D1 migrations to production recipes-db
```

Seeds are static, idempotent SQL (`scripts/seed.sql`, INSERT OR IGNORE) —
run via `db:seed:local` / `db:seed:remote`. Don't add ad-hoc seed data.

## Workflow — issue to merged PR (follow every step, in order)

0. **Claim:** work only issues labeled `agent:implement`, one at a time.
   Comment on the issue that you're starting. Stay inside the issue body;
   scope-creep goes in a comment, not the PR. Never pull from `needs-triage`,
   `ready-for-human` (owner-only actions), or `blocked-external`.
1. **Branch:** `git checkout main && git pull --ff-only`, then
   `git checkout -b feat/mN-short-desc` or `fix/short-desc`.
   Never work on `main`. Never push to `main` (merges deploy to prod).
2. **Work:** small commits, imperative messages (`area: what`). Never commit
   secrets, tokens, `.dev.vars`, or unrelated files.
3. **Verify before every push:** `npm run check` + `npm run build` green.
   Fix the cause; never weaken types or config to silence errors.
4. **Push:** `git push -u origin <branch>` — your branch only.
5. **Open PR:** `gh pr create --base main` with title `<type>(mN): short desc`;
   body follows `.github/PULL_REQUEST_TEMPLATE.md` (Issue `Closes #N`,
   What/Why, Verification, Human gates). Then
   `gh pr edit --add-label agent:review --add-milestone <mN>`.
   Merge auto-closes the issue via `Closes #N` — never close issues by hand.
6. **Review loop** (repeat until green — do not skip steps):
   - CI: `gh pr checks <N>`. `main` requires strict-green `build`, so fix
     failures, re-run check/build locally, push.
   - Threads: `main` requires every conversation resolved. Read them all —
     `gh pr view <N> --comments` plus inline:
     `gh api repos/benalloway/recipes/pulls/<N>/comments`.
     Address each one: fix the code or reply with reasoning. Bot reviews
     (opencode-review) count as reviewers — apply or rebut, never ignore.
     Reply `addressed in <sha>` on threads you fixed; resolve only those,
     and leave owner/human threads for the owner.
   - Stale branch (`main` moved): `git fetch origin && git rebase origin/main`,
     then `git push --force-with-lease`. Never merge `main` into the branch
     (linear history is enforced on `main`).
7. **Land:** you NEVER merge and NEVER push to `main`. When CI is green and
   every thread is addressed, comment `ready for owner merge` on the PR and
   stop. Owner merges; post-merge verify/deploy is the owner's job.
- **Blocked?** Missing secret, dashboard/DNS action, or anything matching
  `blocked-external`: document it in Human gates + an issue/PR comment and
  stop. Don't guess at prod.

## Working locally (human + local agents — automation-safe)

Plain comments (unless `/oc`), adding `agent:in-progress`, and adding
`agent:blocked` do not start a cloud implement run. (Legacy `in-progress` /
`blocked` are still honored by the preflight during transition; they retire
in the docs audit.) Opening a PR does start `opencode-review`, but not cloud implementation. Follow this protocol:

0. **Claim:** comment `taking this locally` on the issue and add `agent:in-progress`.
   Ensure the issue has `Blocked by` + `Touches` sections (template) so the
   preflight can see you. Never apply `triage-requested` / `agent:implement`
   for local work — those labels start cloud implement. If the issue already
   carries `agent:implement`, check the Actions tab first: a running implement
   will NOT abort (`cancel-in-progress: false`). Only go local if no run is
   active — then remove `agent:implement` to disarm it.
1. **Branch + build** exactly like the cloud workflow (same naming,
   `npm run check` + `npm run build`, `CHANGES.md`, PR template with
   `Closes #N`). Local superpower: you can use `npm run preview`, wrangler
   CLIs, and direct D1/R2 access — things cloud runs must not do.
2. **Free review:** opening the PR triggers `opencode-review` automatically.
   Want the address loop too? Add `agent:review` — bot review comments
   then get auto-addressed (≤2 rounds) like any pipeline PR.
3. **Take over a cloud PR:** work on its branch directly. To fully take over,
   remove `agent:review` (stops the loop) and say so in a comment.
   To hand back, push, re-add the label, comment `/oc continue …`.
 4. **Your open `Closes #N` PR is a guard:** implement preflight refuses to
    start a duplicate run while it exists, and triage overlap-checks your
    `agent:in-progress` issue's `Touches`. Remove `agent:in-progress` once the PR is open;
    the PR becomes the in-flight marker.

## Autonomous pipeline (no human in the loop)

Labeling an issue `triage-requested` starts automation end to end:

0. `opencode-triage` adversarially reviews the spec against the
   `ready-for-agent` bar (CONTRIBUTING.md). FAIL → gaps list, back to
   `needs-triage` (also clears `agent:blocked`: rework moots the hold). PASS → it
   applies `ready-for-agent` + `agent:implement`, then runs the frontier check:
   native blocked-by edges, open `Blocked by` refs, same-file overlap between
   the spec's `Touches` list and files changed by open PRs / in-flight issues,
   external gates. Anything waiting → it also applies `agent:blocked` with the
   reason in a comment. Approval (`ready-for-agent`) and hold
   (`agent:blocked`) are orthogonal — never one instead of the other.
1. `opencode-implement` fires on `agent:implement` and on `agent:blocked`
   removal. Its bash preflight refuses on `wayfinder:*` issues, human kills,
   active claims, holds, open refs, duplicate PRs, and file overlap
   (refusal = comment + ensure `agent:blocked`, stop).
   On start it adds `agent:in-progress`; when its PR opens it removes
   `agent:in-progress` (the PR becomes the in-flight marker).
2. `opencode-review` auto-reviews the PR on open and on every push (ready PRs only).
3. `opencode-address-review` fires on the bot's review comment: implements what
   it agrees with, replies `Flagging for human: <reason>` in-thread on what it
   doesn't, and adds `ready-for-human` so the loop stops for the owner.

Loop guards: address runs max 2 rounds per PR (then hands to human); runs are
skipped on PRs labeled `ready-for-human` or without `agent:review`;
human reviews never trigger auto-address. Kill switches (any one stops the
loop): add `ready-for-human`, remove `agent:review`, or close the PR.
Each round costs ~2 agent sessions (review + address) plus the implement run.

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

## Agent skills

Project skills live in `.agents/skills/` (Pocock set, pinned in
`skills-lock.json`; update with `npx skills update`). Before plan/spec work,
read `docs/agents/domain.md` (vocabulary + doc map),
`docs/agents/issue-tracker.md` (tracker rules: publish as `needs-triage`,
never `ready-for-agent` directly), and `docs/agents/triage-labels.md`
(label vocabulary incl. `blocked`). Useful skills: `to-tickets` (vertical
slices with `Blocked by` edges), `grill-with-docs` (plan sessions), `triage`
(spec review input — the workflows' triage verdict still rules),
`improve-codebase-architecture` (deep-module audits), `wayfinder` (multi-session
decision maps), `diagnosing-bugs` (hard-bug loop), `code-review`
(local pre-push self-review), `retro` (post-session env feedback).

## Misc

- Code comments only where non-obvious. Match existing style.
- License is `UNLICENSED` while private; the fork story (see PLAN.md) decides
  the license later.

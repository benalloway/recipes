# Bootstrap — replicate this setup in a new repo

This repo doubles as the template ("our sandcastle"): GitHub automation +
OpenCode skills + free-tier Cloudflare architecture, all portable. Follow
these steps; the per-repo checklist at the end is the only bespoke part.

What you get: label-gated agent pipeline (triage → implement → review →
address, with the orthogonal `agent:blocked` hold), Pocock skills wired to repo
conventions, Astro SSR + D1/R2 behind a portability boundary, CI with
strict-green `build` on `main` and auto-deploy on merge.

## 1. Prereqs

- GitHub repo (private is fine), `gh` CLI authed
- OpenCode with an API key (`OPENCODE_API_KEY`)
- Cloudflare account (free tier covers Workers 100k req/day, D1 5 GB,
  R2 10 GB); Node 24; `npx wrangler` access

## 2. Copy these files

| Copy | Role |
| ---- | ---- |
| `.github/workflows/` (all 7) | CI + agent pipeline (triage/implement/review/address/update-branch/on-demand) |
| `.github/ISSUE_TEMPLATE/` (all) | Spec format (`agent-task.md`: Goal/Tasks/Acceptance/Human gates with `Blocked by` + `Touches`, headings parsed by automation — keep exact) + wayfinder map/ticket templates |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR format (`Closes #N`, Verification, Human gates) |
| `AGENTS.md`, `CONTRIBUTING.md` | Agent protocol + human flow (adapt the stack section per repo) |
| `docs/agents/` | Skill config: tracker rules, label table, domain map (rewrite `domain.md` per repo) |
| `skills-lock.json` + `npx skills update` | Pinned Pocock skill catalog (full set); or reinstall: `npx skills@latest add mattpocock/skills -s "<space-separated names>" -y` (installs to `.agents/skills/`). Keep vendored files byte-pristine; repo overrides live in `docs/agents/issue-tracker.md` |
| `scripts/setup-labels.sh` | Idempotent label vocabulary (run it) |
| `src/lib/runtime.ts`, `src/lib/adapters/*`, `src/env.d.ts` | Portability boundary pattern (adapt bindings per app) |
| `wrangler.jsonc` | Bindings + routes + `platformProxy` dev (adapt names/ids) |

## 3. Labels, secrets, protection

```sh
./scripts/setup-labels.sh          # automation vocabulary (idempotent)
```

Secrets — repo Settings → Secrets → Actions: `OPENCODE_API_KEY` (agent runs).
For auto-deploy: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
(`ci.yml` deploy job; scope the token to Workers/D1 for this account).
App secrets never go in the repo: local via `.dev.vars` (gitignored),
production via `npx wrangler secret put <NAME>` (human-owned session; agents
never handle tokens).

Branch protection on `main`: require PR, require strict-green `build` status
check, enforce linear history (squash-merge). Agents never merge — merges
deploy to production.

## 4. Cloudflare free-tier setup (human, once)

```sh
npx wrangler login                                   # human-owned session
npx wrangler d1 create <db-name>                     # paste id into wrangler.jsonc
npx wrangler r2 bucket create <bucket>               # enable R2 in dashboard first (one-time click)
```

Custom domain: Worker → Domains (route already in `wrangler.jsonc`).
Email (if needed): Resend free tier (3k/mo) + SPF/DKIM in Cloudflare DNS +
`wrangler secret put`. Cloudflare Email Sending needs Workers Paid — the
`mail.ts` adapter makes that a one-file swap later.

## 5. Per-repo checklist (the only bespoke part)

- [ ] `PLAN.md`: architecture, schema, milestones, design language
- [ ] `AGENTS.md` stack section + `docs/agents/domain.md` vocabulary
- [ ] `wrangler.jsonc`: names, ids, routes; `ci.yml` D1 database name
- [ ] `package.json` scripts (`dev/check/build/preview/db:*`)
- [ ] `scripts/seed.sql` if the app needs seeds (idempotent `INSERT OR IGNORE`)
- [ ] Product labels beyond the automation set (`mvp`, `post-mvp`, area tags…)

## 6. Operating

Publish tickets as `needs-triage` (never `ready-for-agent` directly) with
`Blocked by` edges (native blocked-by edges preferred); label `triage-requested` to start the pipeline; remove
`agent:blocked` to resume held work. Budget ~4 agent sessions per issue. Kill
switches: add `ready-for-human`, remove `agent:review`, or close.

# Bootstrap — replicate this setup in a new repo

This repo doubles as the template: local Sandcastle factory +
OpenCode skills + free-tier Cloudflare architecture, all portable. Follow
these steps; the per-repo checklist at the end is the only bespoke part.

What you get: `parallel-planner-with-review` AFK loop (planner → implement →
review → merger, 1:1 with `mattpocock/sandcastle`), Pocock skills wired to
canonical docs (`GLOSSARY.md` + `docs/adr/`), Astro SSR + D1/R2 behind a
portability boundary, CI with strict-green `build` on `main` and auto-deploy
on merge.

## 1. Prereqs

- GitHub repo (private is fine), `gh` CLI authed
- OpenCode with an API key (`OPENCODE_API_KEY`)
- Cloudflare account (free tier covers Workers 100k req/day, D1 5 GB,
  R2 10 GB); Node 22; Docker; `npx wrangler` access

## 2. Copy these files

| Copy | Role |
| ---- | ---- |
| `.sandcastle/` (`main.ts`, `*-prompt.md`, `CODING_STANDARDS.md`, `Dockerfile`, `.env.example`, `.gitignore`) | AFK factory (1:1 with upstream template; fill `CODING_STANDARDS.md` per repo) |
| `.github/workflows/ci.yml` | CI only (`check` + `build`, deploy on `main`) |
| `.github/ISSUE_TEMPLATE/` (wayfinder templates + `agent-task.md`) | Spec format + wayfinder map/ticket templates |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR format (summary, evidence, merge-danger) |
| `AGENTS.md`, `CONTRIBUTING.md` | Agent protocol + human flow (adapt the stack section per repo) |
| `GLOSSARY.md`, `docs/adr/`, `docs/agents/` | Canonical skill config: vocabulary, decisions, tracker rules |
| `skills-lock.json` + `npx skills update` | Pinned Pocock skill catalog (full set); or reinstall: `npx skills@latest add mattpocock/skills -y` (installs to `.agents/skills/`). Keep vendored files byte-pristine |
| `scripts/setup-labels.sh` | Canonical label vocabulary (run it) |
| `src/lib/runtime.ts`, `src/lib/adapters/*`, `src/env.d.ts` | Portability boundary pattern (adapt bindings per app) |
| `wrangler.jsonc` | Bindings + routes + `platformProxy` dev (adapt names/ids) |

## 3. Labels, secrets, protection

```sh
./scripts/setup-labels.sh          # canonical vocabulary (idempotent)
cp .sandcastle/.env.example .sandcastle/.env  # fill OPENCODE_API_KEY
```

Secrets — for auto-deploy: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
(`ci.yml` deploy job; scope the token to Workers/D1 for this account).
App secrets never go in the repo: local via `.dev.vars` (gitignored),
production via `npx wrangler secret put <NAME>` (human-owned session; agents
never handle tokens). No agent secrets in GitHub Actions — agents run local.

Branch protection on `main`: require PR, require strict-green `build` status
check, enforce linear history (squash-merge). Pre-launch the Sandcastle
merger merges directly; add a human merge gate once real users exist.

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
- [ ] `GLOSSARY.md`: domain vocabulary (+ `docs/adr/` for decisions)
- [ ] `.sandcastle/CODING_STANDARDS.md`: stack + style + testing rules
- [ ] `wrangler.jsonc`: names, ids, routes; `ci.yml` D1 database name
- [ ] `package.json` scripts (`dev/check/build/preview/db:*/sandcastle`, `zod` for the planner)
- [ ] `scripts/seed.sql` if the app needs seeds (idempotent `INSERT OR IGNORE`)
- [ ] Product labels beyond the automation set (`post-mvp`, area tags…)

## 6. Operating

Triage tickets to `ready-for-agent` (with the `Sandcastle` label to include
them in the plan); run `npm run sandcastle` from the branch you want merged
into. Up to 10 plan → execute → merge cycles per run; branch names are
deterministic (`sandcastle/issue-{id}`), so re-runs preserve progress.

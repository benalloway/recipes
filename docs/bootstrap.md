# Bootstrap — replicate this setup in a new repo

This repo doubles as the template: Forge AFK factory +
OpenCode skills + free-tier Cloudflare architecture, all portable. Follow
these steps; the per-repo checklist at the end is the only bespoke part.

What you get: `parallel-planner-with-review` AFK loop (planner → implement →
review → merger, via Forge), Pocock skills wired to
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
| Factory via Forge | Follow Forge `docs/INSTALL.md` (labels, `.forge/` vendor, `forge.yml` wrapper, secrets) — do not copy factory files by hand |
| `.sandcastle/CODING_STANDARDS.md` | Reviewer standards (fill per repo; path is Forge's default) |
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
# Labels: Forge `docs/INSTALL.md` Step 1 (idempotent loop, includes Forge + triage roles)
```

Secrets — for auto-deploy: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
(`ci.yml` deploy job; scope the token to Workers/D1 for this account).
Factory secrets: `OPENCODE_API_KEY` (+ `FORGE_GH_TOKEN` for reliable PR
delivery) as repo Actions secrets — see Forge `docs/INSTALL.md` Step 6.
App secrets never go in the repo: local via `.dev.vars` (gitignored),
production via `npx wrangler secret put <NAME>` (human-owned session; agents
never handle tokens).

Branch protection on `main`: require PR, require strict-green `build` status
check, enforce linear history (squash-merge). Forge delivers PRs by default;
enable `push` delivery only with green CI gating deploys.

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
- [ ] `package.json` scripts (`dev/check/build/preview/db:*`, plus `forge*` from Forge INSTALL Step 5)
- [ ] `scripts/seed.sql` if the app needs seeds (idempotent `INSERT OR IGNORE`)
- [ ] Product labels beyond the automation set (`post-mvp`, area tags…)

## 6. Operating

Triage tickets to `ready-for-agent` (with the `Forge` label to include
them in the plan); run `npm run forge` from the branch you want merged
into, or trigger `forge.yml` on Actions. Branch names are
deterministic (`forge/issue-{id}`), so re-runs preserve progress.

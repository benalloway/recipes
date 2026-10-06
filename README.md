# Recipes

Insanely lightweight recipe app — `recipes.benalloway.com`

- **Stack:** Astro 7 (SSR) + Cloudflare Workers · D1 (SQLite) · R2 · Resend
- **Design goal:** instant mobile render, zero framework JS, free tier end to end
- See [PLAN.md](./PLAN.md) for the full build plan and milestone status.

## Local dev

```sh
npm install
npm run dev          # astro dev (bindings proxied from wrangler.jsonc)
npm run build        # production build → dist/
npm run preview      # wrangler dev against the built bundle (same as prod)
npm run check        # tsc --noEmit

npm run db:migrate:local    # apply D1 migrations to local/miniflare sqlite
npm run db:migrate:remote   # apply D1 migrations to production recipes-db

npm run db:seed:local       # idempotent seed (tags + ingredients) — local
npm run db:seed:remote      # idempotent seed — production
```

Secrets: copy `.dev.vars.example` → `.dev.vars` (gitignored) for local dev;
production secrets via `wrangler secret put RESEND_API_KEY`.

## Auth dev flow (magic links without Resend)

Until #6 wires the Resend domain + `RESEND_API_KEY` secret, `sendMail()`
falls back to logging the message to the server console instead of sending.
To sign in locally: submit your email at `/login`, then copy the
`/auth/verify?token=…` link from `npx astro dev logs` and open it.
The link itself is logged only in dev builds (`npm run dev`), never in
preview/production — so a missing key in prod can't leak tokens into logs.
Production always has the secret set, so real sends never take this path.

## Portability contract

All Cloudflare glue lives in `src/lib/runtime.ts` + `src/lib/adapters/*`
(db / blobs / mail) and `src/env.d.ts`. Porting to any other host means
reimplementing those files only — nothing else imports platform modules.

## Process (how work gets done here)

- **Humans:** [CONTRIBUTING.md](./CONTRIBUTING.md) — idea → issue
  (`needs-triage` + `Sandcastle`) → `/triage` → `npm run sandcastle` → push → auto-deploy.
- **Agents:** [AGENTS.md](./AGENTS.md) — stack invariants, commands, and the
  local Sandcastle factory (planner → implementers → reviewers → merger).
  Skill/vocabulary config: [`docs/agents/`](./docs/agents/),
  [`GLOSSARY.md`](./GLOSSARY.md), [`docs/adr/`](./docs/adr/).
  Factory: [`.sandcastle/`](./.sandcastle/). CI only:
  [.github/workflows/README.md](./.github/workflows/README.md).
- **Replicate this setup** in a new repo: [docs/bootstrap.md](./docs/bootstrap.md)
  + [`scripts/setup-labels.sh`](./scripts/setup-labels.sh).

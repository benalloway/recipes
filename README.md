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

## Portability contract

All Cloudflare glue lives in `src/lib/runtime.ts` + `src/lib/adapters/*`
(db / blobs / mail) and `src/env.d.ts`. Porting to any other host means
reimplementing those files only — nothing else imports platform modules.

# CHANGES — production log

What is live. One entry per production deploy or schema change, newest first,
in the same PR that changes production. Keep it terse: Change / Verify / Rollback.

Verify uses: `production = https://recipes.benalloway.com`.
Rollback for a bad worker deploy: `npx wrangler rollback` (immediately reverts to
the previous version). Schema migrations are additive; record manual steps if one
would ever need undoing.

---

---

## 2026-10-05 — auto-deploy pipeline enabled (PR #10)

Change: Actions deploy job now ships `main` on every merge (remote D1 migrations
→ `npm run deploy`); creds via CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID repo
secrets. Worker behavior unchanged.

Verify: deploy job green on the tooling merge run; `curl -s https://recipes.benalloway.com/api/health`.

Rollback: n/a — pipeline config only; worker rollback path unchanged.

## 2026-10-04 — M1: schema + seeds applied to prod (PR #9)

Change: D1 `0001_init.sql` applied to recipes-db (all 10 tables); `scripts/seed.sql`
run (18 tags, 62 canonical ingredients). No worker deploy.

Verify: `npx wrangler d1 execute recipes-db --remote --json --command "SELECT (SELECT COUNT(*) FROM tags) AS tags, (SELECT COUNT(*) FROM ingredients) AS ingredients"`
→ tags 18, ingredients 62, sessions 0, recipes 0.

Rollback: n/a — additive schema + idempotent seeds.

## 2026-10-04 — M0: worker live (PR #8, squashed a4546f3)

Change: Worker `recipes` deployed with Astro 7 SSR bundle; custom domain
`recipes.benalloway.com` attached (`wrangler deploy --domain`); D1 `recipes-db`
created (id pinned in wrangler.jsonc); KV `SESSION` pinned to namespace
`recipes-session`; imageService passthrough; `workers_dev`/`preview_urls` off.

Verify: `curl -s https://recipes.benalloway.com/api/health` → `{"ok":true,...}`.

Rollback: `npx wrangler deployments list` → `npx wrangler rollback`.

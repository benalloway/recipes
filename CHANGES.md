# CHANGES — production log

What is live. One entry per production deploy or schema change, newest first,
in the same PR that changes production. Keep it terse: Change / Verify / Rollback.

Verify uses: `production = https://recipes.benalloway.com`.
Rollback for a bad worker deploy: `npx wrangler rollback` (immediately reverts to
the previous version). Schema migrations are additive; record manual steps if one
would ever need undoing.

---

---

## Unreleased — M3 slice 2: recipe create (issue #14)

Change: signed-in recipe create — `GET /recipes/new` form (title, servings,
instructions textarea, 8 ingredient rows with canonical-name datalist, tag
checkboxes) + POST in the same file, `?error=<code>` banners, no
repopulation. `createRecipe` in `src/lib/recipes.ts` inserts recipe (NULL
head first) → head version (n=1) → ingredient rows (canonical match by
slug, else new uncategorized row) → known tags → bookshelf shelve (not
favorited). No images (M3d), no edit/delete. No migrations.

Verify: `npm run check` + `npm run build` green, CI green; local e2e via
`npm run preview` (logged-out POST 302, valid create 303 → detail renders,
`nope` tag ignored, empty-title/bad-servings 303 with recipe count
unchanged).

Rollback: `npx wrangler rollback` (no schema change).

## Unreleased — M3 slice 1: recipe library reads (issue #13)

Change: signed-in library reads — dashboard grid (`/`), detail
(`/recipes/[id]`, JSON-LD included), tag pages (`/tags/[slug]`),
favorites (`/favorites`), favorite toggle (`POST /recipes/[id]/favorite`,
303 back to same-origin referer). Ownership enforced in
`src/lib/recipes.ts`: non-owned / missing / deleted all read as 404.
No migrations (reads over the M1 schema).

Verify: `npm run check` + `npm run build` green, CI green; local e2e via
`npm run preview` (logged-out 302s, 2-card dashboard, favorites filter,
detail fields + JSON-LD, 404s for unknown tag/id and non-owner,
toggle 1→0 with 303s, POST to unknown id 404s).

Rollback: `npx wrangler rollback` (no schema change).

## 2026-10-05 — M2: magic-link auth + sessions live (PR #11)

Change: email magic-link login end-to-end — session middleware gates all
pages (302 to `/login`), `POST /auth/request` (validate, 1/email/30s
rate-limit, SHA-256 token, 15-min TTL), `GET /auth/verify` (single-use
consume → 30d session cookie), `POST /auth/logout`, `/login` page
(Email/Phone tabs), console-fallback mail until #6. No migrations.

Verify: `npm run check` + `npm run build` green, CI green; local e2e via
`npm run dev` (unauth 302, request/verify/logout flow, 429 on re-POST,
token reuse rejected); `curl -s https://recipes.benalloway.com/login`.

Rollback: `npx wrangler rollback` (no schema change).

## 2026-10-05 — Tailwind CSS v4 styling live (7dd81a5, backfill)

Change: styling layer moved from hand-written custom properties to
Tailwind CSS v4 CSS-first config (`@theme` tokens, preflight off);
same design language, no visual change. Auto-deployed on push to main.

Verify: `curl -s https://recipes.benalloway.com/` serves inline
`tailwindcss v4.3.3` CSS with the bone/hairline/accent `--color-*` tokens.

Rollback: `npx wrangler rollback` (styling-only change).

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

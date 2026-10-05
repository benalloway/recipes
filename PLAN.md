# RECIPES

## Summary

Build "Recipes" — an insanely lightweight, free-to-run recipe app at
`recipes.benalloway.com`. Minimal moving parts, instant mobile rendering,
SQLite-backed, git-style recipe version history, fork-based sharing, designed
toward capsule meal planning.

Key decisions (confirmed with user):

- **Platform:** Cloudflare Workers + D1 (SQLite) + R2 — all free tier
- **Frontend:** Astro 5 (SSR via Cloudflare adapter) + plain TS islands (no framework)
- **Auth MVP:** Email magic link only (Resend free: 3k/mo, 100/day); phone+code UI
  stubbed ("soon" tab), wired later via Twilio (paid)
- **Sharing:** private by default, share-by-link, others keep read-only reference
  and fork to edit; edits never propagate across users
- **History:** git-style — append-only immutable full-snapshot versions; revert =
  new version; fork records lineage (forked_from_recipe_id + forked_from_version_id)
- **Images:** client-resized upload → R2
- **Repo strategy:** one repo per app (no monorepo); Cloudflare/Resend glue behind
  3 tiny adapters (db / blobs / mail) so apps are portable and fork-friendly
- **Email:** Resend (Cloudflare Email sending requires Workers Paid $5/mo for
  arbitrary recipients — noted; `mail.ts` makes the swap a one-file change later)
- **Domain:** `recipes.benalloway.com` (benalloway.com already on Cloudflare DNS)
- **Design:** American Psycho business card aesthetic — bone white, hairline
  rules, Helvetica, generous whitespace, one restrained accent
- **Recipe types:** any recipe works — desserts, dinners, breakfasts, drinks
  (hot/iced/alcoholic). Type-agnostic model; category lives in tags only

## Architecture

Stack:

- Astro 5 + `@astrojs/cloudflare`, SSR mode; static assets served free/unlimited
- D1: `recipes-db` (+ local sqlite file via wrangler/miniflare in dev)
- R2: `recipes-media`
- Resend for magic-link email; `RESEND_API_KEY` as Worker secret
- CI: GitHub → Workers Builds; deploy via `wrangler deploy`

Islands (plain TS, no framework): quantity scaler, ingredient autocomplete,
delete-confirm modal, favorite toggle, image uploader.

AI import stub: `server/import.ts` — `importFromUrl(url)` /
`importFromImage(key)` return 501 behind `AI_IMPORT_ENABLED` flag; LLM output
schema pre-defined to match recipe-draft shape.

## Schema (D1 migrations; plain-SQLite, no D1-specific SQL)

```sql
users(id, email UNIQUE, phone NULL, display_name, created_at)
magic_tokens(id, user_id, token_hash, expires_at, used_at NULL)   -- 15-min TTL, single-use, SHA-256, 1/email/30s rate limit
sessions(id, user_id, token_hash UNIQUE, expires_at)              -- ~30d; HttpOnly, Secure, SameSite=Lax; hash-at-rest

recipes(id, owner_user_id, forked_from_recipe_id NULL, forked_from_version_id NULL,
        head_version_id, deleted_at NULL, created_at)             -- soft delete
recipe_versions(id, recipe_id, n, title, servings, instructions JSON,
                image_key NULL, edit_note NULL, created_by, created_at) -- immutable, append-only

ingredients(id, name, slug UNIQUE, category NULL)                 -- canonical; enables capsule overlap queries
recipe_ingredients(recipe_version_id, ingredient_id, quantity REAL, unit, note, position)

tags(id, name, slug)                                              -- seeded: italian, mexican, breakfast, dinner, fast, easy, gluten-free, dairy-free, vegetarian, vegan...
recipe_tags(recipe_id, tag_id)
user_recipes(user_id, recipe_id, is_favorite, added_at)           -- "user's list of recipe ids"
```

Steps stay JSON (prose, never joined across recipes); ingredients are relational
(the join keys for capsule meal planning).

**Type-agnostic recipes (confirmed):** nothing in the model assumes food "meals"
— any kind of recipe: desserts, dinners, breakfasts, drinks (hot, iced,
alcoholic, coffee, tea, mocktails). No `course`/`meal_type` columns; type lives
purely in tags. Free-form `unit` TEXT already accommodates drinks vocabulary
(oz, dash, splash, shot). M1 tag seeds extended with: `dessert`, `lunch`,
`snack`, `appetizer`, `drink`, `hot`, `cold`, `alcoholic`.

## Pages / routes

- `/login` (Email / Phone tabs; phone disabled "soon")
- `/` dashboard grid (image, title, tags, favorite ★)
- `/recipes/[id]` (schema.org JSON-LD, scaler island)
- `/recipes/new`, `/recipes/[id]/edit` (ingredient autocomplete island)
- `/recipes/[id]/history` (version timeline + revert)
- `/favorites`, `/tags/[slug]`
- `/media/*` → R2 (portability: swap to S3 = one file)

## Design system (American Psycho business card)

Implemented with Tailwind CSS v4 (CSS-first config, `@tailwindcss/vite`).
Same tokens, same look — no visual change from the swap:

- Bone white `#FBFBF9`; white surfaces; hairline `#E3E3E0`; ink `#1A1A1A`;
  muted `#8A8A86`; single accent `#9A8C7C` (links/focus only)
- Tokens live in `@theme` in `src/styles/global.css` → utilities `bg-bg`,
  `bg-surface`, `border-hairline`, `text-ink`, `text-muted`, `text-accent`,
  `font-sans`. Base element styles stay in `@layer base` in the same file
- Preflight is intentionally off (browser defaults preserved for unstyled
  elements); enabling it would be a visual change needing a design decision
- System type stack: Helvetica Neue → Helvetica → Arial; 10px letter-spaced
  uppercase micro-labels; light 22–28px headings; tabular numerals
- 8px grid; hairline flat cards; no shadows; ≤2px radius; motion = 120ms opacity only

## Milestones

- **M0** — scaffold Astro+wrangler, D1 local, deploy hello-world to
  `recipes.benalloway.com`
- **M1** — migrations + seeds (tags incl. dessert/drink/appetizer/etc,
  ~50 common ingredients)
- **M2** — magic-link auth end-to-end + sessions (Resend domain setup: add
  SPF/DKIM records to Cloudflare DNS, verify `benalloway.com`, send from
  `login@benalloway.com`)
- **M3** — recipe CRUD: forms, R2 images, soft delete + confirm modal,
  dashboard + favorites + tag chips
- **M4** — versioning: append-on-save, history timeline, revert
- **M5** — quantity scaler island + fraction display (½ ⅓ ⅛, egg/clove hints)
- **M6** — share-by-link + fork
- **M7** — version diff viewer; capsule engine (ingredient-overlap recipe
  suggestions with have/need diff); shopping list
- **M8** — AI import (URL/photo); phone+code via Twilio (~$1–15/mo)

MVP = M0–M5. M6+ post-MVP; user may pull M6 in — re-confirm at M5.

## Costs

All free tier: Workers (100k req/day, unlimited static), D1 (5M reads / 100k
writes/day, 5 GB), R2 (10 GB), Resend (3k/mo). Future: SMS if phone login added;
Workers Paid $5/mo only if limits require — then optional swap to Cloudflare
Email Service via `mail.ts`.

## Out of scope (MVP)

Phone login (UI stub only), AI import (function stub only), diff viewer,
capsule engine, shopping list, multi-image galleries.

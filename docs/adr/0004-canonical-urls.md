# ADR 0004 — Canonical URLs: standalone subdomain root

Date: 2026-10-15 (supersedes the 2026-10-15 apex-subpath decision below)
Status: accepted (companion to ADR-0005 in `benalloway-dot-com`, which owns
the site-wide routing table)

## Context

QA on production found two symptoms of one structural problem:

1. `benalloway.com/recipes` vs `benalloway.com/recipes/` behaved as different
   login states (RFC 6265 §5.1.4: the session cookie carried
   `Path=/recipes/`, so browsers omitted it on bare `/recipes`).
2. Inside the Recipes app there is no elegant way back to `benalloway.com` —
   the app shares an identical marketing header with the apex site but is a
   different product (private signed-in recipe app vs public editorial
   personal site).

## Decision

- **Canonical home: `https://recipes.benalloway.com/` (subdomain root).**
  The worker serves at `/` (no Astro `base`); `src/lib/base.ts` `u()` is the
  identity function (module + call sites kept so a future base flip stays a
  config-level choice). The only Wrangler route is the
  `recipes.benalloway.com` custom domain.
- **Apex `/recipes*` 301s to the subdomain root** (zone redirect rule
  `apex-path consolidation`, ref `recipes-subdomain-to-apex-path`,
  human-owned) — never link to the apex path.
- **Session cookie is host-local `Path=/`** (`verify.ts` sets it, `logout.ts`
  mirrors it on delete), so one cookie covers the whole app host.
- **App shell, not marketing header:** the layout is a compact Catalyst-style
  app topbar (`h-14`, bottom border, app mark + `Shelf`/`Favorites` pill tabs
  + primary `+ New Recipe` + user email pill / `Sign in` + theme toggle) with
  a minimal footer linking back to `benalloway.com ↗`.

## Consequences

- All app-absolute URLs must still go through `u()` (enforced in review).
- After every routing change, verify `https://recipes.benalloway.com/`
  (200) — there is no second home to check.
- Pre-rename nested-URL compat 308s (`/recipes/*` → `/recipe/*`) stay in
  `src/middleware.ts` for stale bookmarks; the bare-`/recipes` canonicalizer
  is gone (meaningless with no base).

---

## Superseded (2026-10-15, same day): apex subpath home, subdomain alias

This worker was reachable two ways: directly at `recipes.benalloway.com`
(custom domain) and at `benalloway.com/recipes*` (path route). The earlier
decision made `benalloway.com/recipes/*` canonical with the subdomain 301ing
there. Reversed within the day per the QA findings above: one host, one home,
host-local cookie.

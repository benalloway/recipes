# ADR 0004 — Canonical URLs: apex subpath home, subdomain alias

Date: 2026-10-15
Status: accepted (companion to ADR-0005 in `benalloway-dot-com`, which owns
the site-wide routing table)

## Context

This worker is reachable two ways: directly at `recipes.benalloway.com`
(custom domain) and at `benalloway.com/recipes*` (path route). One of them
must be canonical or sessions, links, and SEO split across two homes.

## Decision

- **Canonical home: `benalloway.com/recipes/*`.**
  `recipes.benalloway.com/*` 301s there (zone redirect rule
  `apex-path consolidation`). The subdomain custom domain stays attached as
  a rollback path, not as a destination — never link to it.
- **Same-host future:** staying on the apex keeps a future single sign-on
  across sections possible (one cookie, `Path=/`); subdomains would make
  that impossible by design.
- **Reversal cost is low:** `src/lib/base.ts` `u()` + Astro `base` make the
  canonical home a config-level choice. Flipping back = drop `base`, make
  `u()` identity, remove the path route, reverse the redirect.

## Consequences

- All app-absolute URLs must go through `u()` (enforced in review).
- After every routing change, verify BOTH `benalloway.com/recipes/` (200)
  and `recipes.benalloway.com/` (301 to the apex path).

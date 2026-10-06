# Domain Docs (single-context)

One context for the whole repo. Skills needing domain language read these in
order; do not invent synonyms for terms defined here.

1. `PLAN.md` — the source of truth: product summary, architecture, schema
   sketch, pages/routes, design system, milestones (M0–M8), costs, out of scope.
2. `migrations/*.sql` — the canonical schema (plain SQLite, portable). PLAN.md
   sketches; migrations rule on conflicts.
3. `scripts/seed.sql` — canonical tags + ingredients (slugs are the join keys).
4. `AGENTS.md` — agent protocol: stack invariants, portability boundary
   (`src/lib/runtime.ts`, `src/lib/adapters/*`), commands, issue→PR workflow,
   autonomous pipeline + loop guards, deploy policy.
5. `CONTRIBUTING.md` — human-side flow and the `ready-for-agent` bar.
6. `.github/workflows/README.md` — automation trigger map.

Core vocabulary: recipe (pointer row) / version (`recipe_versions`, immutable,
`n`, `head_version_id`) / revert (= new version) / fork (lineage columns) /
soft delete (`deleted_at`, never DELETE) / canonical ingredient (match by slug)
 / tag (seeded slugs) / `user_recipes` (bookshelf + `is_favorite`) / capsule
(ingredient-overlap planning) / island (plain-TS, no framework).

Automation vocabulary (see `docs/agents/triage-labels.md` for the full table):
map (`wayfinder:map`, the planning artifact) / decision ticket
(`wayfinder:research` / `prototype` / `grilling` / `task`) / frontier (open,
unblocked, unclaimed tickets) / claim (`agent:in-progress` or assignee) /
approval (`ready-for-agent`, spec accepted) vs hold (`agent:blocked`,
execution waits) / execution trigger (`agent:implement`).

No `GLOSSARY.md`: the list above is the glossary. ADRs are not kept separately;
decisions with dates live in issue comments and `CHANGES.md` entries.

# GLOSSARY

Single-context vocabulary for this repo. Skills must use these terms verbatim
and not invent synonyms. See `docs/agents/domain.md` for consumer rules.

- **recipe**: pointer row (`recipes`); never holds content directly
- **version**: immutable full snapshot (`recipe_versions`, `n`, `head_version_id`)
- **revert**: creating a new version that restores older content (never mutates)
- **fork**: share-by-link copy recording lineage (`forked_from_recipe_id` +
  `forked_from_version_id`); edits never propagate across users
- **soft delete**: `deleted_at` set, never `DELETE`
- **canonical ingredient**: `ingredients` row matched by `slug`; capsule join key
- **tag**: seeded `tags` row (e.g. italian, dessert, drink, vegetarian); type lives
  in tags only — no `course`/`meal_type` columns
- **bookshelf**: `user_recipes` (`is_favorite`, `added_at`)
- **capsule**: ingredient-overlap meal planning (have/need diff, suggestions)
- **island**: plain-TS interactive bit, no framework
- **portability boundary**: `src/lib/runtime.ts`, `src/lib/adapters/*`,
  `src/env.d.ts` — the only files that may import platform modules

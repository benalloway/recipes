# ADR 0002 — Cardstock design language

Date: 2026-10-06
Status: accepted (owner grill 2026-10-06; amends the PLAN.md design section
by reference — PLAN's "American Psycho business card" paragraph is superseded
by this ADR, milestones and architecture untouched)

## Context

The shipped M3 UI proved the backend but reads sterile: no navigation, no
entry points (no link to `/recipes/new` anywhere, stale "arriving in #14"
copy), forms wipe input on validation errors (303 + `?error=`, no
repopulation), photography is untreated `w-full` blocks with `alt=""`, and
dead ends greet logged-out visitors. Owner direction: keep minimalism, but
make it original and warm — lined recipe cards + Braun discipline + chapbook
voice. Borrow proven UX patterns; never copy another app's look.

## Decision — "Cardstock"

Tactile minimalism. The card stays a feeling: warmth from materials (paper,
rules, ink), never decoration.

- **Tokens** (`@theme` in `src/styles/global.css`, utilities generated):
  paper `#FAF7F0` (page), card `#FFFDF8` (surfaces), rule `#E5DCC9`
  (hairlines, warmed), ink `#201A15` (warm near-black), muted `#8A7F72`,
  accent paprika `#B4432A` (links/focus/active only). Sharp corners only
  (no radius beyond 2px). No new colors, fonts, or shadows without a new ADR.
- **Type**: grotesk micro-labels for structure (existing Helvetica stack,
  10px letterspaced uppercase — the instrument); a serif with character for
  recipe titles (the chapbook voice); one handwriting face for marginalia
  only — edit notes, personal asides, empty-state notes (never body copy,
  never labels).
- **Plates, not heroes**: user photos get a warm duotone/tint overlay at low
  opacity inside restrained frames with fixed aspect ratios (no unbounded
  `w-full` heights). Every cookbook page reads art-directed regardless of
  source photo. Meaningful `alt` (recipe title); decorative thumbs `alt=""`.
- **Calm abundance**: generous grid with breathing room on dashboard/browse
  surfaces. No fan motif, no overlap tricks.
- **Shell**: global nav in `Base` (Recipes / Favorites / New), entry points
  on every surface (edit link on detail, login CTA for logged-out), real
  empty states, no stale copy.
- **Forms**: server re-renders with submitted values + inline errors (replaces
  the 303-wipe pattern); dynamic ingredient rows (add/remove island); sticky
  submit on mobile; keep `?error=` codes only for deep-linkable cases.

## Consequences

- `.sandcastle/CODING_STANDARDS.md` enforces this ADR at review time.
- Form POST handlers change shape (re-render vs redirect) — slices 2's
  ticket carries the migration per page.
- M4 (history) / M5 (scaler) stay paused, then build natively in Cardstock.

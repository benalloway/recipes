# Issue tracker (GitHub) — repo conventions for skills

Issues live in this repo's GitHub Issues (`gh` CLI). Every unit of work follows
`.github/ISSUE_TEMPLATE/agent-task.md` (Goal / Tasks / Acceptance / Human gates),
plus the two machine-readable sections below that the automation depends on.
PLAN.md is the source of truth; milestones are never redefined without the owner.

## Publishing rules (overrides skill defaults)

- New tickets are created with label `needs-triage` and the milestone set.
  **Never apply `ready-for-agent` when publishing.** Promotion to
  `ready-for-agent` is the automation's job: `triage-requested` → adversarial
  triage → PASS *and* frontier-clear → `ready-for-agent` → implement fires.
  (This overrides `to-tickets` step 5's "apply `ready-for-agent` unless
  instructed otherwise", and the vendored `triage` skill's "quick state
  override": you are hereby instructed otherwise. Belt and suspenders: the
  implement preflight fails closed on missing `Touches`, so a directly-labeled
  issue without conflict data cannot run.)
- Do NOT close or rewrite a parent issue when splitting it. Archive the original
  body in a comment first, then rewrite; link siblings both ways.
- Prefer vertical slices (tracer bullets): each ticket delivers one demoable,
  end-to-end behavior with runnable acceptance, not one horizontal layer.

## `Blocked by` section (required on every ticket)

```markdown
## Blocked by

- None (can start immediately).
```

or list each edge: `- #13 (detail page this asserts against)`,
`- external: recipes-media bucket must exist`. Open refs gate execution:
triage PASS applies `ready-for-agent` plus `blocked` while any edge is open,
and implement refuses until all edges clear.

## `Touches` section (required on every ticket)

```markdown
## Touches

`src/lib/recipes.ts`, `src/pages/recipes/new.astro`
```

Repo-relative paths the implementation is expected to change. Triage validates
the list; the blocked-gate diffs it against files changed by open PRs and
`ready-for-agent` issues to detect same-file conflicts before implement fires.
`CHANGES.md` need not be listed (always rebase-trivial).

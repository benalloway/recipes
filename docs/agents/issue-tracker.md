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
  (Target vocabulary at cutover: triage PASS applies `ready-for-agent` plus
  `agent:implement`, holds with `agent:blocked`. Until the Phase 4 preflight
  cutover, the live names are `ready-for-agent` / `blocked`.)
  (This overrides `to-tickets` step 5's "apply `ready-for-agent` unless
  instructed otherwise", and the vendored `triage` skill's "quick state
  override": you are hereby instructed otherwise. Belt and suspenders: the
  implement preflight fails closed on missing `Touches`, so a directly-labeled
  issue without conflict data cannot run.)
- Do NOT close or rewrite a parent issue when splitting it. Archive the original
  body in a comment first, then rewrite; link siblings both ways.
- Prefer vertical slices (tracer bullets): each ticket delivers one demoable,
  end-to-end behavior with runnable acceptance, not one horizontal layer.
- `to-spec` publishes specs as `needs-triage` like any other ticket (overrides
  its "apply `ready-for-agent`" step: you are hereby instructed otherwise).
  Specs enter the same adversarial triage before anything builds them.
- `implement` / `implement-spec` in this repo mean the AGENTS.md Workflow
  lifecycle, not the skill's bare loop: work on a fresh `feat/*` / `fix/*`
  branch (never the current branch, never `main`), verify with
  `npm run check` + `npm run build`, open a PR per `.github/PULL_REQUEST_TEMPLATE.md`
  with `Closes #N`, add the `CHANGES.md` entry when production behavior changes,
  never merge. The skill's "commit to the current branch" and standalone
  `/tdd`+`/code-review` closeout are subordinate to that lifecycle. Likewise
  `implement-spec`'s integration branch, per-ticket worktrees, and merger
  subagents are forbidden here: one ticket = one `feat/*` / `fix/*` branch =
  one PR; linear history via rebase, never merges into the branch.
- Wizards instantiated from the `wizard` skill must set `ENV_FILE=.dev.vars`
  (repo convention, gitignored) — never the template default `.env`, which is
  not ignored here and could persist secrets to a committable file.

## `Blocked by` section (required on every ticket)

```markdown
## Blocked by

- None (can start immediately).
```

or list each edge: `- #13 (detail page this asserts against)`,
`- external: recipes-media bucket must exist`. Open refs gate execution:
triage PASS applies `ready-for-agent` plus `blocked` while any edge is open
(`agent:implement` + `agent:blocked` after the Phase 4 cutover),
and implement refuses until all edges clear.

## `Touches` section (required on every ticket)

```markdown
## Touches

`src/lib/recipes.ts`, `src/pages/recipes/new.astro`
```

Repo-relative paths the implementation is expected to change. Triage validates
the list; the blocked-gate diffs it against files changed by open PRs and
`ready-for-agent` issues to detect same-file conflicts before implement fires
(`agent:in-progress`-issue overlap joins the check at the Phase 4 cutover).
`CHANGES.md` need not be listed (always rebase-trivial).

## Wayfinding operations (how this repo expresses the wayfinder skill)

Map and tickets live as GitHub issues. Hierarchy uses **native sub-issues**;
execution gating uses **native blocked-by edges**. Body-text `## Blocked by`
sections remain as human-readable fallback until the preflight cutover lands.

- **Create the map**: `gh issue create --label "wayfinder:map"` with the
  Destination / Notes / Decisions-so-far / Not-yet-specified / Out-of-scope
  body (template `wayfinder-map.md`). Never add triage or implement labels.
- **Create tickets as sub-issues**: `gh issue create --parent <map> --label
  "wayfinder:<type>"` (verified on gh 2.102.0; older CLIs need the REST
  attach fallback below) using templates `wayfinder-research.md`,
  `wayfinder-prototype.md`, `wayfinder-grilling.md`, `wayfinder-task.md`,
  or attach later via `POST /repos/{owner}/{repo}/issues/{map}/sub_issues`
  with the child's id.
- **Blocking between tickets**: native edges via
  `POST .../issues/{n}/dependencies/blocked_by` with body
  `{"issue_id": <integer database id>}` — note the id must be the integer
  database id (from GraphQL `databaseId`), not the `I_...` node id, and `gh
  api -f` sends strings so pipe typed JSON with `--input -`. Read back with
  `GET .../dependencies/blocked_by` or `gh issue view <n> --json blockedBy`.
- **Claim**: assign the ticket to yourself before any work (assignee is the
  claim); open + unassigned means unclaimed.
- **Frontier**: open, unblocked, unclaimed children —
  `gh api repos/{owner}/{repo}/issues/{map}/sub_issues` filtered by state,
  labels, assignees, and `blocked_by` emptiness.
- **Resolve**: post the answer as a resolution comment, close the issue,
  append a gist-link line to the map's Decisions-so-far.
- **Graduate**: fog patches that sharpen become new sub-issue tickets;
  buildable outcomes graduate via `to-tickets` as `needs-triage` build
  tickets with `Blocked by` + `Touches`, entering the normal pipeline.

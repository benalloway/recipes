# Contributing (human side)

This repo is built by agents, directed by humans. The whole flow:

```
idea → plan session → issue (needs-triage) → /triage → ready-for-agent + Sandcastle
  → npm run sandcastle (planner → implement → review → merger)
  → you push → CI deploys → verify live
```

## Plan the issue

Start a plan session (`/grill-with-docs`) and write the issue with
`/to-spec` + `/to-tickets`: vertical tracer-bullet slices, each with blocking
edges. New issues land in `needs-triage` with the `Sandcastle` label if
Sandcastle should pick them up — automation ignores them until triaged.

## Triage: the `ready-for-agent` bar

`/triage` moves issues through `needs-triage` → `needs-info` /
`ready-for-agent` / `ready-for-human` / `wontfix` (with `bug`/`enhancement`).
`ready-for-agent` means **"go build this unattended"** — the next Sandcastle
run plans it. Don't apply it by hand on a guess; grill the spec first
(goal, acceptance, blocking edges, single scope, no open questions).

## Run the factory

```sh
cp .sandcastle/.env.example .sandcastle/.env  # once (OPENCODE_API_KEY)
npm run sandcastle                              # from the branch to merge into
```

Up to 10 plan → execute → merge cycles. The planner picks unblocked
`Sandcastle` issues, implementers build each on `sandcastle/issue-{id}`,
reviewers refine per `.sandcastle/CODING_STANDARDS.md`, the merger merges
completed branches and closes their issues (`Completed by Sandcastle`).
Follow along in the terminal and `.sandcastle/logs/`.

## After a run (yours only)

Review the merged result (`git log`, `npm run check` + `npm run build`,
`npm run preview` smoke). Push when happy — merges to `main` deploy via CI.
Verify live (`CHANGES.md` top entry tells you what to check).

Local superpowers the sandboxes don't need: `npm run preview`, wrangler
CLIs, direct D1/R2 access — use them after the run to verify.

## Stop the loop (yours only)

- **Stop a run:** `Ctrl-C`. Worktrees with uncommitted changes are preserved
  on disk; clean ones are removed.
- **Keep an issue out of the plan:** remove its `Sandcastle` label or move it
  to `ready-for-human` / `wontfix`.
- **Re-run:** just run `npm run sandcastle` again — branch names are
  deterministic (`sandcastle/issue-{id}`), so progress is preserved.

Workflow details: [`AGENTS.md`](./AGENTS.md) (agent protocol),
[`.sandcastle/main.ts`](./.sandcastle/main.ts) (factory),
[`GLOSSARY.md`](./GLOSSARY.md) + [`docs/adr/`](./docs/adr/) (vocabulary/decisions).

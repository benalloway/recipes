# Contributing (human side)

This repo is built by agents, directed by humans. The whole flow:

```
idea → plan session → issue (needs-triage) → /triage → ready-for-agent + Forge
  → npm run forge (or forge:gh on Actions: planner → implement → review → merger)
  → you push → CI deploys → verify live
```

## Plan the issue

Start a plan session (`/grill-with-docs`) and write the issue with
`/to-spec` + `/to-tickets`: vertical tracer-bullet slices, each with blocking
edges. New issues land in `needs-triage` with the `Forge` label if
Forge should pick them up — automation ignores them until triaged.

## Triage: the `ready-for-agent` bar

`/triage` moves issues through `needs-triage` → `needs-info` /
`ready-for-agent` / `ready-for-human` / `wontfix` (with `bug`/`enhancement`).
`ready-for-agent` means **"go build this unattended"** — the next Forge
run plans it. Don't apply it by hand on a guess; grill the spec first
(goal, acceptance, blocking edges, single scope, no open questions).

## Run the factory

```sh
npm run forge       # local run, from the branch to merge into
npm run forge:gh    # or trigger on GitHub Actions (PR delivery by default)
```

**Where does it run?** Triage sets routing alongside `ready-for-agent`
(see `docs/agents/triage-labels.md`): no routing label (or `run:cloud`) runs
on cloud Actions automatically; add `run:home` and the home server
(`thinkcentre-m73`) picks it up instead while cloud skips it. From your
phone: create the issue from the Agent-task template, grill it, triage to
`ready-for-agent`, and add `run:home` only if you want the home server.

Up to `FORGE_MAX_ITERATIONS` plan → execute → merge cycles. The planner picks
unblocked `Forge` issues, implementers build each on `forge/issue-{id}`,
reviewers refine per `.sandcastle/CODING_STANDARDS.md`, the merger merges
completed branches, delivers (PR by default), and closes their issues
(`Completed by Forge`). Follow along in the terminal (local) or the Actions
run log; local worktrees live under `.sandcastle/worktrees/`.

## After a run (yours only)

Review the merged result (`git log`, `npm run check` + `npm run build`,
`npm run preview` smoke). Push when happy — merges to `main` deploy via CI.
Verify live (`CHANGES.md` top entry tells you what to check).

Local superpowers the sandboxes don't need: `npm run preview`, wrangler
CLIs, direct D1/R2 access — use them after the run to verify.

## Stop the loop (yours only)

- **Stop a run:** `Ctrl-C`. Worktrees with uncommitted changes are preserved
  on disk; clean ones are removed.
- **Keep an issue out of the plan:** remove its `Forge` label or move it
  to `ready-for-human` / `wontfix`.
- **Re-run:** just run `npm run forge` again — branch names are
  deterministic (`forge/issue-{id}`), so progress is preserved.

Workflow details: [`AGENTS.md`](./AGENTS.md) (agent protocol),
[`.forge/`](./.forge) (vendored factory — never hand-edit),
[`GLOSSARY.md`](./GLOSSARY.md) + [`docs/adr/`](./docs/adr/) (vocabulary/decisions).

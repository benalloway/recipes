# Workflows

Two GitHub workflows: `CI` (`ci.yml`) and `Forge` (`forge.yml`, a thin
wrapper over the reusable `benalloway/forge` factory pinned at `v1`).
Agents run locally (`npm run forge`) or in Actions via `forge.yml`.

| Workflow | Trigger | Does | Guards |
|---|---|---|---|
| `CI` (`ci.yml`) | push to `main`, PRs, manual | `check` + `build`; on `main`: D1 migrations → deploy | Required strict-green `build` on `main` (branch protection) |
| `Forge` (`forge.yml`) | issue labeled `Forge` + `ready-for-agent` (skips `run:home`), or manual (`npm run forge:gh`) | Runs the vendored `.forge/` factory (planner → implementers → reviewers → merger), verifies `check` + `build`, delivers (PR by default) | `concurrency: forge-factory`, `check` + `build` gate before delivery |

Agent pipeline (vendored from `benalloway/forge@v1`,
`parallel-planner-with-review`): planner reads open `Forge`-labeled
issues → implementers work each unblocked issue on `forge/issue-{id}`
in git-worktree sandboxes → reviewer refines each branch → merger merges
completed branches, delivers, and closes their issues. See `.forge/` (never
hand-edit) and `docs/agents/` for the tracker and label vocabulary.

## Routing: cloud vs home server

Triage (`ready-for-agent`) decides *whether* a ticket runs; routing labels
decide *where* (see `docs/agents/triage-labels.md`):

- No routing label (or `run:cloud`) → cloud `forge.yml` picks it up.
- `run:home` → cloud skips it (job `if:` guard); the home-server runner
  (`thinkcentre-m73`) polls `Forge` + `ready-for-agent` + `run:home`.
- Whichever side starts first comments `Claimed by <cloud|home-server>` so
  the other side sees it before starting.

## Required GitHub Secrets for `forge.yml`

- `OPENCODE_API_KEY` — agent runtime key.
- `FORGE_GH_TOKEN` (strongly recommended) — fine-grained PAT (Contents RW,
  Issues RW, Pull requests RW, Metadata R). Without it the factory falls back
  to `GITHUB_TOKEN`, which cannot open PRs unless the repo enables "Allow
  GitHub Actions to create and approve pull requests" (Settings → Actions →
  General), and whose pushes do NOT trigger downstream workflows (so CI
  deploys would not fire after a factory push).

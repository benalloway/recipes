# Workflows

One GitHub workflow. Agents run fully local via Sandcastle
(`npx tsx .sandcastle/main.ts`) — nothing agent-driven runs in Actions.

| Workflow | Trigger | Does | Guards |
|---|---|---|---|
| `CI` (`ci.yml`) | push to `main`, PRs, manual | `check` + `build`; on `main`: D1 migrations → deploy | Required strict-green `build` on `main` (branch protection) |

Agent pipeline (local, 1:1 with `mattpocock/sandcastle`
`parallel-planner-with-review`): planner reads open `Sandcastle`-labeled
issues → implementers work each unblocked issue on `sandcastle/issue-{id}`
in Docker sandboxes → reviewer refines each branch → merger merges completed
branches into the current branch and closes their issues. See
`.sandcastle/main.ts` and `docs/agents/` for the tracker and label vocabulary.

# Workflows

Seven automation workflows. All agent runs use
`opencode/muse-spark-1.3-contributor-free` at max variant via
`OPENCODE_API_KEY` (change `model:`/`variant:` per file to diverge).
Prompts must name `docs/agents/issue-tracker.md` as required reading before
any skill output is trusted. Label vocabulary: `docs/agents/triage-labels.md`.
The transition names (`blocked`, `in-progress`, `ai-drafted-feedback`) were
retired in the Phase 5 audit (#30): the preflight ignores them and they no
longer exist as labels.

| Workflow | Trigger | Does | Guards |
|---|---|---|---|
| `CI` (`ci.yml`) | push to `main`, PRs, manual | `check` + `build`; on `main`: D1 migrations → deploy | Required strict-green `build` on `main` (branch protection) |
| `opencode-triage` | issue labeled `triage-requested` | Adversarial spec review against the `ready-for-agent` bar; PASS applies `ready-for-agent` + `agent:implement` + frontier check (native blocked-by edges, `Blocked by` text, `Touches` overlap, external gates → also `agent:blocked`); FAIL posts gaps and returns to `needs-triage` (clears `agent:blocked`); refuses `wayfinder:*` issues | Issues only; never implements; one run per issue (concurrency) |
| `opencode-implement` | issue labeled `agent:implement`, or `agent:blocked` removed | Bash preflight refuses on wayfinder label / human kill / active claim / hold / open refs (native + text) / duplicate PR / file overlap vs open PRs and in-flight issues (comment + ensure `agent:blocked`, no agent runs); else branches, implements per `AGENTS.md`, verifies, opens PR labeled `agent:review` | Issues only (no PRs); spec gate in prompt as backstop (incomplete → back to `needs-triage`); one run per issue, no cancel (concurrency) |
| `opencode-review` | PR opened / push / reopened / ready | Posts a code review (ready PRs only, drafts skipped) | Drafts skipped; read-only (never pushes) |
| `opencode-address-review` | Bot review comment on `agent:review` PR | Implements agreements, pushes fixes; disagreements → in-thread `Flagging for human` + `ready-for-human` | Label gates; placeholder/own-summary excluded; hard 2-round budget step; latest run wins (concurrency) |
| `opencode-update-branch` | PR labeled `agent:update-branch` | Rebases the PR branch onto latest `main` (no merges); conflict aborts + `ready-for-human` for human | Pure bash (no agent); force-with-lease push; one run per PR (concurrency) |
| `opencode` | `/oc` comment (issue/PR/review) | On-demand agent for triage, fixes, follow-ups | Mention-gated; resume path after `ready-for-human` (`/oc continue …`) |

Resume after human intervention: remove `ready-for-human` and comment
`/oc continue addressing the review`.

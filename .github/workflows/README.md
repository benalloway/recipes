# Workflows

Five automation workflows. All agent runs use
`opencode/muse-spark-1.3-contributor-free` at max variant via
`OPENCODE_API_KEY` (change `model:`/`variant:` per file to diverge).

| Workflow | Trigger | Does | Guards |
|---|---|---|---|
| `CI` (`ci.yml`) | push to `main`, PRs, manual | `check` + `build`; on `main`: D1 migrations → deploy | Required strict-green `build` on `main` (branch protection) |
| `opencode-triage` | issue labeled `triage-requested` | Adversarial spec review against the `ready-for-agent` bar; PASS promotes to `ready-for-agent` (cascades into implement), FAIL posts gaps and returns to `needs-triage` | Issues only; never implements; one run per issue (concurrency) |
| `opencode-implement` | issue labeled `ready-for-agent` | Branches, implements per `AGENTS.md`, verifies, opens PR | Issues only (no PRs); spec gate in prompt as backstop (incomplete → back to `needs-triage`); one run per issue (concurrency) |
| `opencode-review` | PR opened / push / reopened / ready | Posts a code review (ready PRs only, drafts skipped) | Drafts skipped; read-only (never pushes) |
| `opencode-address-review` | Bot review comment on `ai-drafted-feedback` PR | Implements agreements, pushes fixes; disagreements → in-thread `Flagging for human` + `ready-for-human` | Label gates; placeholder/own-summary excluded; hard 2-round budget step; latest run wins (concurrency) |
| `opencode` | `/oc` comment (issue/PR/review) | On-demand agent for triage, fixes, follow-ups | Mention-gated; resume path after `ready-for-human` (`/oc continue …`) |

Resume after human intervention: remove `ready-for-human` and comment
`/oc continue addressing the review`.

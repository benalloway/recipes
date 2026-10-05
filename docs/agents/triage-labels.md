# Triage Labels

> **Target Sandcastle vocabulary.** This table describes where the repo is
> going, not (yet) what the automation runs: `blocked` / `in-progress` /
> `ai-drafted-feedback` plus `ready-for-agent`-fires-implement remain
> authoritative until the Phase 4 preflight cutover lands. Do not apply the
> `agent:*` execution labels expecting workflows to fire before then.

Skills speak in canonical triage roles; this table maps each role to this
repo's label string. Sandcastle-format mapping (see `mattpocock/sandcastle`
`docs/agents/triage.md`): left column is the skills vocabulary, right column
is what this tracker actually uses.

| Label in mattpocock/skills | Label in our tracker | Meaning |
| -------------------------- | -------------------- | ------- |
| `needs-triage` | `needs-triage` | Spec not yet adversarially reviewed |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Spec approved (approval only — execution needs `agent:implement`) |
| `ready-for-human` | `ready-for-human` | Owner-only work; automation kill switch (stops every loop) |
| `wontfix` | `wontfix` | Will not be actioned |

Repo automation roles every skill must respect:

| Role | Label | Meaning |
| ---- | ----- | ------- |
| triage requested | `triage-requested` | Starts the adversarial triage run; removed on verdict. Repo extension — upstream has no counterpart (their triage is skill-driven) |
| execution trigger | `agent:implement` | Triage PASS applies this (with `ready-for-agent`); implement fires on this label, not on approval alone |
| review trigger | `agent:review` | Implement applies this to the PR; review runs and marks it ready. Replaces `ai-drafted-feedback` |
| branch refresh | `agent:update-branch` | Refresh a stale PR branch against `main` |
| exploration | `agent:explore` | Run the exploration agent on an issue |
| in-flight | `agent:in-progress` | Claim marker: cloud run or local session active. Implement refuses while present (renamed from `in-progress`) |
| automation hold | `agent:blocked` | Orthogonal to approval: spec approved but execution waits (open refs, conflicts, failure). Removing it re-fires implement when `agent:implement` is present (renamed from `blocked`) |
| external gate | `blocked-external` | Waiting on dashboard/DNS/secret/account action (owner-only) |
| wayfinder map | `wayfinder:map` | Canonical wayfinder artifact; never carries triage/implement labels |
| wayfinder ticket | `wayfinder:research` / `prototype` / `grilling` / `task` | Decision tickets; claimed by assignee; never carry triage/implement labels |
| backlog | `post-mvp` | Post-MVP scope; never implement from here |

Blocked semantics: `agent:blocked` never replaces `ready-for-agent` — approval
and hold are independent. Implement runs only when `agent:implement` is present
AND `agent:blocked` is absent. Wayfinder issues must never carry
`triage-requested`, `ready-for-agent`, or `agent:implement`; the implement
preflight refuses any `wayfinder:*` label outright.

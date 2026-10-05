# Triage Labels

Skills speak in canonical triage roles; this table maps each role to this
repo's label string. First five rows are the upstream defaults (kept as-is);
the rest are repo automation roles every skill must respect.

| Role (skills vocabulary) | Label in this tracker | Meaning |
| ------------------------ | --------------------- | ------- |
| `needs-triage` | `needs-triage` | Spec not yet adversarially reviewed |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Frontier-clear: implement fires immediately on this label |
| `ready-for-human` | `ready-for-human` | Owner-only work; automation kill switch (stops every loop) |
| `wontfix` | `wontfix` | Will not be actioned |
| triage requested | `triage-requested` | Starts the adversarial triage run; removed on verdict |
| automation hold | `blocked` | Orthogonal to `ready-for-agent`: spec is approved but execution must wait. Set on triage PASS-with-blockers, by implement preflight on discovering a conflict, on workflow failure, or by a human. Implement refuses while present. Removing it re-fires implement when `ready-for-agent` is present |
| external gate | `blocked-external` | Waiting on dashboard/DNS/secret/account action (owner-only) |
| pipeline tag | `ai-drafted-feedback` | Marks agent-owned PRs; review/address loops key off it |
| backlog | `post-mvp` | Post-MVP scope; never implement from here |

Blocked semantics: `blocked` never replaces `ready-for-agent` — approval and hold
are independent. Triage PASS on a gated spec applies both labels. Implement
runs only when `ready-for-agent` is present AND `blocked` is absent. When the
hold clears, removing `blocked` re-fires implement (unlabeled event), which
re-checks the frontier before touching code.

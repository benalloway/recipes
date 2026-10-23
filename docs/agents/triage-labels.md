# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Routing labels (orthogonal to triage)

Triage decides *whether* an agent should act; routing decides *where* it runs.
Apply at triage time, alongside `ready-for-agent`:

| Label | Meaning |
| ----- | ------- |
| `run:cloud` | Run on GitHub Actions cloud Forge. Default when neither routing label is present. |
| `run:home` | Run on the home-server agent (`thinkcentre-m73`). Cloud `forge.yml` skips these (job `if:` guard); the home runner polls `Forge` + `ready-for-agent` + `run:home`. |

Remote rule of thumb: filing from your phone/laptop and want cloud? Just triage to `ready-for-agent` (+ optional `run:cloud`). Want the home server to do it? Add `run:home`.

# Contributing (human side)

This repo is built by agents, directed by humans. The whole flow:

```
idea → plan session → issue (needs-triage) → triage → ready-for-agent
  → agent implements → PR → auto review → auto address (≤2 rounds)
  → you merge → auto deploy → verify live
```

## Plan the issue

Start a plan session with an agent and write the issue using the
`Agent task` template (Goal / Tasks / Acceptance / Human gates).
New issues land in `needs-triage` — automation ignores them there.

## Triage: the `ready-for-agent` bar

Moving an issue to `ready-for-agent` means **"go build this unattended."**
The label is the trigger — the implement workflow fires immediately.
Promote only when ALL hold:

- [ ] Goal is one outcome; Tasks are executable with no hidden context
- [ ] Acceptance is verifiable (commands where possible)
- [ ] Human gates filled in (`none` if not applicable)
- [ ] Single scope (one branch → one PR); milestone set
- [ ] No open questions; nothing irreversible; no prod secrets required

If an autonomous run sends an issue back to `needs-triage`, the spec
failed the bar — fix the spec, not the agent.

## Watch the pipeline

`ready-for-agent` → implement opens a PR → review posts → address fixes
(≤2 rounds) or flags disagreements with `ready-for-human`. Follow along in
the PR and the Actions tab. Nudge anytime with `/oc <instruction>` comments.

## Merge (yours only)

Agents never merge — merging `main` deploys to production. When CI is green
and threads are resolved, review and merge the PR yourself. It auto-closes
its issue via `Closes #N`. Then verify live (`CHANGES.md` top entry tells
you what to check).

## Stop the loop

Any one of these halts automation: add `ready-for-human`, remove
`ai-drafted-feedback`, or close the PR. Budget roughly ~4 agent sessions
per issue (implement + review + up to 2× address).

Workflow details: [`AGENTS.md`](./AGENTS.md) (agent protocol) and
[`.github/workflows/README.md`](./.github/workflows/README.md) (trigger map).

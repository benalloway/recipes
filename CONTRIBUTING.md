# Contributing (human side)

This repo is built by agents, directed by humans. The whole flow:

```
idea → plan session → issue (needs-triage) → triage-requested
  → agent verdicts spec → ready-for-agent + agent:implement → agent implements
  → PR → auto review → auto address (≤2 rounds)
  → you merge → auto deploy → verify live
```

## Plan the issue

Start a plan session with an agent and write the issue using the
`Agent task` template (Goal / Tasks / Acceptance / Human gates).
New issues land in `needs-triage` — automation ignores them there.

## Triage: the `ready-for-agent` bar

`ready-for-agent` + `agent:implement` mean **"go build this unattended"** — the implement
workflow fires immediately. Don't apply it by hand on a guess. Instead,
label the issue `triage-requested`: an independent triage agent verdicts
the spec against this bar (adversarial — it hunts ambiguity, not excuses):

- [ ] Goal is one outcome; Tasks are executable with no hidden context
- [ ] Acceptance is verifiable (commands where possible)
- [ ] Human gates filled in (`none` if not applicable)
- [ ] `Blocked by` edges declared (or `None`), `Touches` paths listed
- [ ] Single scope (one branch → one PR); milestone set
- [ ] No open questions; nothing irreversible; no prod secrets required

**Pass** → the triage agent applies `ready-for-agent` + `agent:implement` itself (plus `agent:blocked`
while any `Blocked by` edge, file conflict, or external gate is open) and
frontier-clear implementation starts. **Fail** → you get a numbered gaps list and the
issue returns to `needs-triage`: fix the spec, re-request triage.

## Watch the pipeline

`agent:implement` → implement opens a PR → review posts → address fixes
(≤2 rounds) or flags disagreements with `ready-for-human`. Follow along in
the PR and the Actions tab. Nudge anytime with `/oc <instruction>` comments.

## Work it locally instead (yours only)

Plain comments (unless `/oc`), adding `agent:in-progress`, and adding `agent:blocked` do
not start cloud implementation. Opening a PR does start `opencode-review`,
but not cloud implementation. Local work is safe if you claim it:

0. Comment `taking this locally`, add `agent:in-progress`, and make sure the issue
   has `Blocked by` + `Touches` (your PR then guards the issue from
   auto-implement). Never click `triage-requested` / `ready-for-agent` for
   local work. If `agent:implement` is already on it, check Actions first —
   a running cloud implement will not abort; only proceed if nothing runs,
   and remove the label to disarm it.
1. Same conventions as cloud runs (branch names, check/build, `CHANGES.md`,
   `Closes #N`), plus local-only superpowers: `npm run preview`, wrangler
   CLIs, direct D1/R2.
2. Opening the PR gets you a free bot review; add `agent:review` to
   also get the auto-address loop. Remove `agent:in-progress` once the PR is open;
   the PR becomes the in-flight marker.
3. To take over a cloud PR, work on its branch and remove
   `agent:review` to stop the loop. To hand back, push your changes,
   re-add `agent:review`, then comment `/oc continue …`; adding the
   label alone does not restart the address loop.

## Merge (yours only)

Agents never merge — merging `main` deploys to production. When CI is green
and threads are resolved, review and merge the PR yourself. It auto-closes
its issue via `Closes #N`. Then verify live (`CHANGES.md` top entry tells
you what to check).

## Unblock / stop the loop (yours only)

- **Blocked issue:** read the `agent:blocked` comment for the reason (open `Blocked
  by` ref, file conflict, external gate, failed run). Fix the cause, then
  remove the `agent:blocked` label — implement re-fires automatically if
  `agent:implement` is still applied. (Legacy `blocked` also re-fires until
  the docs audit retires it.) Never remove `agent:blocked` to "see what
  happens"; the preflight will just re-apply it with another comment.
- **Stop automation** on any issue/PR (any one works): add `ready-for-human`,
  remove `agent:review`, or close the PR/issue.
- **Resume after you intervened:** remove `ready-for-human` and comment
  `/oc continue …` (see `.github/workflows/README.md`).
- **Budget:** roughly ~4 agent sessions per issue (implement + review + up to
  2× address). If a loop keeps cycling, stop it and re-scope the issue.

Workflow details: [`AGENTS.md`](./AGENTS.md) (agent protocol) and
[`.github/workflows/README.md`](./.github/workflows/README.md) (trigger map).

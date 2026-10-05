# TASK

Implement GitHub issue #{{ISSUE_NUMBER}}: {{ISSUE_TITLE}} in this repo.

You are working inside a Sandcastle Docker sandbox on branch {{BRANCH}},
based off `origin/main`. The branch already exists — do NOT create branches,
do NOT push, do NOT open PRs, do NOT merge. The host handles push + PR after
your run. Your job ends with green checks and commits on this branch.

# CONTEXT

Pull the issue first: `gh issue view {{ISSUE_NUMBER}} --comments`. If it has
a parent map or sibling context worth reading, pull that too. Then read
`AGENTS.md` (stack invariants, portability boundary, design tokens, workflow),
the issue's `Blocked by` / `Touches` sections, and `docs/agents/domain.md`.

# EXECUTION

Follow AGENTS.md exactly:

0. The issue must have a clear Goal, executable Tasks, and verifiable
   Acceptance. If any are missing or ambiguous: do NOT implement. Write your
   findings to the log, output `<promise>COMPLETE</promise>`, and stop — the
   host will surface this instead of a PR.
1. Change only what the issue body scopes. Small commits, imperative messages.
2. Obey the portability boundary (`src/lib/runtime.ts`, `src/lib/adapters/*`,
   `src/env.d.ts` only for platform glue), Worker env bindings (never
   `process.env`), plain-SQLite migrations, and the Tailwind `@theme` tokens.
3. Run `npm run check` and `npm run build` until green. Never weaken types or
   config to silence errors.
4. Add the `CHANGES.md` entry (Change / Verify / Rollback) when production
   behavior changes (schema, deploy config, worker behavior).

# FINAL RULES

- NEVER push to `main`. NEVER merge. NEVER read or echo secrets.
- If you are blocked (secrets, dashboard/DNS action, ambiguous spec, or
  anything matching `blocked-external`): commit nothing half-done, write the
  findings to the log, output `<promise>COMPLETE</promise>`, and stop.
- When done, output `<promise>COMPLETE</promise>`.

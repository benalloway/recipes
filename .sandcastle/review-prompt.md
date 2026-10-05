# TASK

Review the changes on branch {{BRANCH}} for issue #{{ISSUE_NUMBER}}:
{{ISSUE_TITLE}}. Do NOT push, open PRs, or merge — leave commits on this
branch only.

# CONTEXT

`gh issue view {{ISSUE_NUMBER}} --comments` for the spec. `git diff
origin/main...HEAD` for the change. `AGENTS.md` for the invariants.

# REVIEW

1. **Spec axis**: every Acceptance item met? Anything missing, partial, or
   extra (scope creep)? Quote the spec line for each finding.
2. **Standards axis**: portability boundary, env bindings, migration SQL,
   design tokens, `CHANGES.md` entry where required.
3. Implement every fix you agree with. For findings you disagree with, do NOT
   code around them — list them under `## Flagged for human` in your summary.
4. Re-run `npm run check` + `npm run build` green. Commit fixes
   (`address review: <what>`).

# FINAL RULES

- NEVER push to `main`. NEVER merge. NEVER read or echo secrets.
- When done, output `<promise>COMPLETE</promise>`.

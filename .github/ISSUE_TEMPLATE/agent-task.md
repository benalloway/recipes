---
name: Agent task
about: Scoped unit of work for an agent (one issue = one branch = one PR)
labels: needs-triage
---

**Goal**

<!-- single-sentence outcome -->

**Tasks**

<!-- checkboxes; keep agent-executable (no hidden context) -->

**Acceptance**

<!-- how the reviewer verifies; commands where possible -->

**Human gates**

<!-- anything agent cannot do itself: dashboard, credentials, DNS. "none" if not applicable -->

## Blocked by

<!-- edges gating execution: `- #N (why)` per open dependency, `- external: ...` per out-of-band gate, or `None (can start immediately)`. Triage PASS applies `blocked` while any edge is open. Heading must stay exactly `## Blocked by` — parsed by automation. -->

- None (can start immediately).

## Touches

<!-- repo-relative paths the implementation is expected to change, for same-file conflict detection. Omit CHANGES.md (always rebase-trivial). One backticked path per line-ish (no spaces inside backticks). Heading must stay exactly `## Touches` — parsed by automation; an empty/unparseable list blocks implement. -->

- (list paths)

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

<!-- edges gating execution: `- #N (why)` per open dependency, `- external: ...` per out-of-band gate, or `None (can start immediately)`. Triage PASS applies `blocked` while any edge is open. -->

- None (can start immediately).

## Touches

<!-- repo-relative paths the implementation is expected to change, for same-file conflict detection. Omit CHANGES.md (always rebase-trivial). -->

- (list paths)

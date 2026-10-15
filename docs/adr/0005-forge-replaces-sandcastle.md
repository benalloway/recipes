# ADR 0005 — Forge replaces local Sandcastle automation

Date: 2026-10-15
Status: accepted (supersedes ADR-0001)

## Context

ADR-0001 adopted the upstream `mattpocock/sandcastle` template 1:1 into
`.sandcastle/` (runner, prompts, Dockerfile, local-first). That template has
since been extracted, generalized, and rebranded as Forge
(`benalloway/forge`, reusable workflow + vendored runner), which additionally
supports GitHub Actions delivery and PR-mode review.

## Decision

- Remove the vendored Sandcastle runner (`.sandcastle/main.ts`, prompts,
  Dockerfile, workflows, labels script, npm scripts, dependency) entirely.
- Adopt Forge per its `docs/INSTALL.md`: factory vendored into `.forge/`
  (pinned, never hand-edited), `forge.yml` wrapper, `Forge` backlog label,
  PR delivery by default.
- Keep `.sandcastle/CODING_STANDARDS.md` in place — it is repo knowledge, not
  automation, and it is Forge's default reviewer standards path. ADR-0001
  stays as history.

## Consequences

- Factory improvements land via `scripts/sync-forge.sh`, not per-repo edits.
- `OPENCODE_API_KEY` (+ `FORGE_GH_TOKEN` for reliable PR delivery) become repo
  Actions secrets; no agent secrets live in the repo.
- The `Sandcastle` GitHub label is retired once open issues are re-labeled.

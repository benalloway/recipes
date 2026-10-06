# ADR 0001 — fully local Sandcastle automation

Date: 2026-10-06
Status: accepted

## Context

The repo previously ran a custom cloud agent pipeline (six `opencode-*`
workflows: triage → implement → review → address, with `agent:*` labels and
`Blocked by`/`Touches` gates). That shape has no upstream counterpart and
drifted from `mattpocock/skills` + `mattpocock/sandcastle` on every update.

## Decision

Adopt the upstream shape 1:1 for everything outside the app:

- `.sandcastle/` is the canonical `parallel-planner-with-review` template
  (planner → parallel implementers → per-branch reviewer → merger), with
  `opencode/big-pickle`, Docker, and GitHub Issues (`Sandcastle` label).
- Triage vocabulary is exactly the five canonical roles (`needs-triage`,
  `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) plus
  `bug`/`enhancement` and the `Sandcastle` backlog label.
- Domain docs follow the single-context layout (`GLOSSARY.md` + `docs/adr/`).
- GitHub Actions runs CI only (`check` + `build`, deploy on `main`).
  No agent runs in the cloud.

## Consequences

- AFK runs happen on the owner machine via `npm run sandcastle`.
  Nothing runs behind the owner's back.
- The merger merges completed `sandcastle/issue-{id}` branches into the
  current branch and closes their issues. Merges to `main` still deploy
  (CI deploy job) — acceptable pre-launch; re-add a human merge gate
  once real users exist.
- App invariants are unchanged (Astro SSR, portability boundary, plain-SQLite
  migrations, Tailwind tokens, `CHANGES.md`, `check`+`build` green).
  `.sandcastle/CODING_STANDARDS.md` carries them so the reviewer enforces them.

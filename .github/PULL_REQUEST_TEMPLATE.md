## Issue

Closes #<number>

## What / Why

<!-- 2-4 sentences: what changed and why it belongs to that issue -->

## Verification

<!-- commands run + key output (build/check/smoke) -->

## Human gates

<!-- anything needing the owner: dashboard actions, credentials, DNS, deploys. Write "none" if not applicable. -->

## Checklist

- [ ] `npm run check` + `npm run build` green (CI re-verifies)
- [ ] Scoped to the issue; no scope-creep
- [ ] Platform glue confined to adapters boundary (if relevant)
- [ ] `CHANGES.md` updated if this changes production (schema/deploy)
- [ ] Labels: `ai-drafted-feedback` + issue's milestone

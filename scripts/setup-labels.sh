#!/usr/bin/env bash
# Idempotent automation label vocabulary (see docs/agents/triage-labels.md).
# Safe to re-run: creates missing labels, aligns color/description otherwise.
# Product labels (mvp/post-mvp/area tags) are per-repo — manage those by hand.
set -euo pipefail

EXISTING_LABELS=$(gh label list --limit 100 --json name --jq '.[].name')

label() { # $1=name $2=color $3=description
  if echo "$EXISTING_LABELS" | grep -qx "$1"; then
    gh label edit "$1" --color "$2" --description "$3"
  else
    gh label create "$1" --color "$2" --description "$3"
  fi
}

label "needs-triage"      "E5DCC9" "Needs review/breakdown before work"
label "triage-requested"  "FBCA04" "Starts adversarial triage; removed on verdict"
label "ready-for-agent"   "0E8A16" "Spec approved; implement fires (unless blocked)"
label "blocked"           "808080" "Automation hold until removed. See workflows README."
label "blocked-external"  "F9D0C4" "Waiting on external service (dashboard/DNS/secrets)"
label "ready-for-human"   "5319E7" "Owner-only work; automation kill switch"
label "in-progress"       "1D76DB" "Agent run active. See workflows README."
label "needs-info"        "D4C5F9" "Waiting on reporter for more information"
label "ai-drafted-feedback" "C2E0C6" "Agent-owned PR; review/address loops key off it"
# Target Sandcastle vocabulary (authoritative after the Phase 4 cutover).
label "agent:implement" "0E8A16" "Run the implementation agent workflow"
label "agent:review" "1D76DB" "Run the automated agent review workflow"
label "agent:update-branch" "FBCA04" "Agent refreshes a stale PR branch"
label "agent:explore" "7057FF" "Run the exploration agent workflow"
label "agent:in-progress" "1D76DB" "Agent workflow is currently running"
label "agent:blocked" "808080" "Agent workflow is blocked or failed"
label "wayfinder:map" "6F42C1" "Wayfinder map issue: canonical planning artifact"
label "wayfinder:research" "6F42C1" "Wayfinder decision ticket: research (AFK)"
label "wayfinder:prototype" "6F42C1" "Wayfinder decision ticket: prototype (HITL)"
label "wayfinder:grilling" "6F42C1" "Wayfinder decision ticket: grilling (HITL)"
label "wayfinder:task" "6F42C1" "Wayfinder decision ticket: manual task"

echo "labels reconciled: $(gh label list --limit 100 --json name --jq '[.[] | select(.name | IN("needs-triage","triage-requested","ready-for-agent","blocked","blocked-external","ready-for-human","in-progress","needs-info","ai-drafted-feedback","agent:implement","agent:review","agent:update-branch","agent:explore","agent:in-progress","agent:blocked","wayfinder:map","wayfinder:research","wayfinder:prototype","wayfinder:grilling","wayfinder:task"))] | length')/20 present"

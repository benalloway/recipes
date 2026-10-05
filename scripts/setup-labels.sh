#!/usr/bin/env bash
# Idempotent automation label vocabulary (see docs/agents/triage-labels.md).
# Safe to re-run: creates missing labels, aligns color/description otherwise.
# Product labels (mvp/post-mvp/area tags) are per-repo — manage those by hand.
set -euo pipefail

EXISTING_LABELS=$(gh label list --json name --jq '.[].name')

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

echo "labels reconciled: $(gh label list --json name --jq '[.[] | select(.name | IN("needs-triage","triage-requested","ready-for-agent","blocked","blocked-external","ready-for-human","in-progress","needs-info","ai-drafted-feedback"))] | length')/9 present"

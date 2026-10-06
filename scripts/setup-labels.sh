#!/usr/bin/env bash
# Canonical label vocabulary (see docs/agents/triage-labels.md).
# 1:1 with mattpocock/skills (five triage roles + two categories) plus the
# Sandcastle backlog label created by `sandcastle init --issue-tracker github-issues`.
# Safe to re-run: creates missing labels, aligns color/description otherwise.
set -euo pipefail

EXISTING_LABELS=$(gh label list --limit 100 --json name --jq '.[].name')

label() { # $1=name $2=color $3=description
  if echo "$EXISTING_LABELS" | grep -Fxq "$1"; then
    gh label edit "$1" --color "$2" --description "$3"
  else
    gh label create "$1" --color "$2" --description "$3"
  fi
}

label "needs-triage"    "E5DCC9" "Maintainer needs to evaluate this issue"
label "needs-info"      "D4C5F9" "Waiting on reporter for more information"
label "ready-for-agent" "0E8A16" "Fully specified, ready for an AFK agent"
label "ready-for-human" "5319E7" "Requires human implementation"
label "wontfix"         "808080" "Will not be actioned"
label "bug"             "D73A4A" "Something is broken"
label "enhancement"     "A2EEEF" "New feature or improvement"
label "Sandcastle"      "F9A825" "Issues for Sandcastle to work on"

echo "labels reconciled: $(gh label list --limit 100 --json name --jq '[.[] | select(.name | IN("needs-triage","needs-info","ready-for-agent","ready-for-human","wontfix","bug","enhancement","Sandcastle"))] | length')/8 present"

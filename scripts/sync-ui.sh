#!/usr/bin/env bash
# Vendor @benalloway/ui into this repo (`src/components/ui/`, `src/styles/global.css`, `src/lib/formatDate.ts`).
# Pass a commit SHA/tag or omit to sync from the current HEAD of `../ui` and update `scripts/ui-version.txt`.
set -euo pipefail

UI_DIR="${UI_CHECKOUT:-../ui}"

if [ ! -d "$UI_DIR/.git" ]; then
  echo "ui checkout not found at $UI_DIR (override with UI_CHECKOUT=...)" >&2
  exit 1
fi

if [ "${1:-}" != "" ]; then
  UI_SHA="$1"
  git -C "$UI_DIR" fetch origin --tags >/dev/null 2>&1 || true
  git -C "$UI_DIR" checkout "$UI_SHA" --quiet
else
  UI_SHA=$(git -C "$UI_DIR" rev-parse HEAD)
fi

echo "$UI_SHA" > scripts/ui-version.txt
mkdir -p src/components/ui src/styles src/lib

cp "$UI_DIR/src/styles/oatmeal.css" src/styles/global.css
cp "$UI_DIR"/src/components/*.astro src/components/ui/
cp "$UI_DIR/src/lib/formatDate.ts" src/lib/formatDate.ts

echo "vendored @benalloway/ui @ $UI_SHA"

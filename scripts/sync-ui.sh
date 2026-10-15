#!/usr/bin/env bash
# Vendor @benalloway/ui into this repo (`src/components/ui/`, `src/styles/global.css`, `src/lib/formatDate.ts`).
# Pass a commit SHA/tag or omit to sync from the current HEAD of `../ui` and update `scripts/ui-version.txt`.
# Never checks out or detaches the ui working tree — files are extracted at the
# pinned SHA via `git archive`.
set -euo pipefail

UI_DIR="${UI_CHECKOUT:-../ui}"

if [ ! -d "$UI_DIR/.git" ]; then
  echo "ui checkout not found at $UI_DIR (override with UI_CHECKOUT=...)" >&2
  exit 1
fi

if [ "${1:-}" != "" ]; then
  UI_SHA="$1"
else
  UI_SHA=$(git -C "$UI_DIR" rev-parse HEAD)
fi

# Resolve tags/short SHAs to a full commit SHA without touching the checkout.
UI_SHA=$(git -C "$UI_DIR" rev-parse --verify "$UI_SHA^{commit}")

echo "$UI_SHA" > scripts/ui-version.txt
mkdir -p src/components/ui src/styles src/lib

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
git -C "$UI_DIR" archive "$UI_SHA" src/components src/styles/oatmeal.css src/lib/formatDate.ts | tar -x -C "$TMPDIR"

cp "$TMPDIR/src/styles/oatmeal.css" src/styles/global.css
cp "$TMPDIR"/src/components/*.astro src/components/ui/
cp "$TMPDIR/src/lib/formatDate.ts" src/lib/formatDate.ts

echo "vendored @benalloway/ui @ $UI_SHA"

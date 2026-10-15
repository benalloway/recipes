#!/usr/bin/env bash
# Vendor @benalloway/ui (pinned in scripts/ui-version.txt) into this repo.
# Committed copies keep deploys hermetic and diffs reviewable.
set -euo pipefail

UI_SHA=$(cat scripts/ui-version.txt)
UI_DIR="${UI_CHECKOUT:-../ui}"

if [ ! -d "$UI_DIR/.git" ]; then
  echo "ui checkout not found at $UI_DIR (override with UI_CHECKOUT=...)" >&2
  exit 1
fi

git -C "$UI_DIR" fetch origin --tags >/dev/null 2>&1 || true
git -C "$UI_DIR" checkout "$UI_SHA" --quiet

cp "$UI_DIR/src/styles/oatmeal.css" src/styles/global.css
cp "$UI_DIR"/src/components/Button.astro \
   "$UI_DIR"/src/components/Badge.astro \
   "$UI_DIR"/src/components/Container.astro \
   "$UI_DIR"/src/components/EmptyState.astro \
   "$UI_DIR"/src/components/Eyebrow.astro \
   "$UI_DIR"/src/components/PageHeader.astro \
   "$UI_DIR"/src/components/Section.astro \
   "$UI_DIR"/src/components/Field.astro \
   "$UI_DIR"/src/components/TextInput.astro \
   "$UI_DIR"/src/components/TextareaInput.astro \
   "$UI_DIR"/src/components/SelectInput.astro \
   "$UI_DIR"/src/components/CheckboxItem.astro \
   "$UI_DIR"/src/components/FileInput.astro \
   "$UI_DIR"/src/components/FormAlert.astro \
   "$UI_DIR"/src/components/SubmitBar.astro \
   src/components/ui/

echo "vendored ui @ $UI_SHA"

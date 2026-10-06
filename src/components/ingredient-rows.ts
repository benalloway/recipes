/**
 * Ingredient-rows island (plain TS, no framework).
 *
 * Controls render `hidden` so the no-JS fallback posts server rows
 * untouched; this island reveals them and wires add/remove:
 * - `[data-add-row]` stamps a `<template data-row-template>` blank with
 *   the next index (`__INDEX__` field names, `__N__` labels). The parser
 *   reads `0..49`, so appended rows submit like server rows.
 * - `[data-remove-row]` removes its row; the last row is cleared instead
 *   so ingredient fields always post. Numbering gaps are fine.
 */

import { MAX_INGREDIENT_ROWS } from '../lib/recipes';

const container = document.querySelector<HTMLElement>('[data-ingredient-rows]');
const template = document.querySelector<HTMLTemplateElement>('template[data-row-template]');
const addButton = document.querySelector<HTMLButtonElement>('[data-add-row]');

if (container && template && addButton) {
  // Progressive enhancement: reveal the controls only when JS runs.
  for (const control of document.querySelectorAll('[data-add-row], [data-remove-row]')) {
    control.removeAttribute('hidden');
  }

  let nextIndex = Number(container.dataset.nextIndex ?? '0');
  if (!Number.isFinite(nextIndex) || nextIndex < 0) nextIndex = 0;

  addButton.addEventListener('click', () => {
    if (nextIndex >= MAX_INGREDIENT_ROWS) return;
    const html = template.innerHTML
      .replaceAll('__INDEX__', String(nextIndex))
      .replaceAll('__N__', String(nextIndex + 1));
    container.insertAdjacentHTML('beforeend', html);
    nextIndex += 1;
    container.dataset.nextIndex = String(nextIndex);
    if (nextIndex >= MAX_INGREDIENT_ROWS) addButton.setAttribute('disabled', '');
  });

  container.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest?.('[data-remove-row]');
    if (!(button instanceof HTMLButtonElement)) return;
    const row = button.closest('[data-ingredient-row]');
    if (!row) return;
    if (container.querySelectorAll('[data-ingredient-row]').length <= 1) {
      for (const input of row.querySelectorAll('input')) input.value = '';
      return;
    }
    row.remove();
  });
}

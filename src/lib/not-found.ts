/**
 * Shared recipe 404 page for the form-post routes (`favorite`, `delete`).
 *
 * Self-contained HTML (no layout): these endpoints answer POSTs, so the
 * 404 must render without the dashboard shell. Palette follows the Oatmeal
 * olive tokens in src/styles/global.css; keep the hexes in sync.
 */
import { u } from './base';

const OLIVE_100 = '#f2f2ec';
const OLIVE_950 = '#23281a';
const OLIVE_700 = '#4a5240';

export function recipeNotFoundPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Not found — Recipes</title>
<style>body{margin:0;background:${OLIVE_100};color:${OLIVE_950};font-family:Inter,system-ui,sans-serif}main{max-width:26rem;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;padding:0 1.5rem}section{background:#fff;border:1px solid rgba(35,40,26,.1);border-radius:1rem;padding:2.5rem 2rem}.micro{font-size:.875rem;font-weight:600;color:${OLIVE_700}}h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:2rem;margin:.5rem 0 0}p{font-size:1rem}a{color:${OLIVE_950};font-weight:500}</style>
</head>
<body><main><section>
<p class="micro">404 — Not found</p>
<h1>Not found</h1>
<p>That recipe does not exist, was deleted, or belongs to someone else.</p>
<p><a href="${u('/')}">← Back to recipes</a></p>
</section></main></body>
</html>`;
}

/**
 * Shared recipe 404 page for the form-post routes (`favorite`, `delete`).
 *
 * Self-contained HTML (no layout): these endpoints answer POSTs, so the
 * 404 must render without the dashboard shell. Palette duplicates `@theme`
 * in src/styles/global.css (no new colors); keep the hexes in sync.
 */
export function recipeNotFoundPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Not found — Recipes</title>
<style>body{margin:0;background:#fbfbf9;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}main{max-width:26rem;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;padding:0 1.5rem}section{background:#fff;border:1px solid #e3e3e0;padding:2.5rem 2rem}.micro{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#8a8a86}h1{font-weight:300;font-size:1.375rem;margin:.75rem 0 0}p{font-size:.9375rem}a{color:#9a8c7c;text-decoration:none}</style>
</head>
<body><main><section>
<p class="micro">404 — Not found</p>
<h1>Not found</h1>
<p>That recipe does not exist, was deleted, or belongs to someone else.</p>
<p><a href="/">← Back to recipes</a></p>
</section></main></body>
</html>`;
}

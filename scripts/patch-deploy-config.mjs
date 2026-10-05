/**
 * astro build emits dist/server/wrangler.json without the custom-domain
 * route (the vite plugin strips `routes`). Re-add our custom domain so
 * `wrangler deploy -c dist/server/wrangler.json` attaches it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'dist/server/wrangler.json';
const d = JSON.parse(readFileSync(p, 'utf8'));
d.routes = [{ pattern: 'recipes.benalloway.com', custom_domain: true }];
writeFileSync(p, JSON.stringify(d));
console.log('patched deploy config: custom domain route');

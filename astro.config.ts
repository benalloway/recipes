// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  // Canonical home is benalloway.com/recipes/* (subdomain 301s there).
  // All links/redirects go through src/lib/base.ts `u()`.
  base: '/recipes',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});

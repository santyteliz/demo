// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio final del sitio (para canonical, Open Graph y sitemap).
const SITE = process.env.SITE_URL || 'https://praderasdearraijan.com';

export default defineConfig({
  site: SITE,
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});

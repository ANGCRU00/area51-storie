// Demo: la home di Area 51 con Astro (pagine) e Solid (isole interattive)
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

export default defineConfig({
  integrations: [solid()],
  build: { format: 'file' },
});

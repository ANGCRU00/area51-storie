// Demo: la home di Area 51 con Astro (pagine) e React (isole interattive). Stessa demo di ../sito-astro, che usa Solid.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  build: { format: 'file' },
});

// Nuovo sito della Fumetteria Area 51: Astro (pagine) + React (isole) pubblicato sui Workers di Cloudflare.
// Le pagine sono preparate alla pubblicazione (statiche) salvo quelle con `export const prerender = false`,
// che girano sul Worker a ogni richiesta e possono leggere D1 e R2.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // niente sessioni di Astro (il login sarà Better Auth, fase 5) e immagini ottimizzate alla costruzione:
  // così non servono uno spazio KV né il servizio Cloudflare Images
  adapter: cloudflare({ imageService: 'compile' }),
  session: false,
  integrations: [react()],
  trailingSlash: 'never',
});

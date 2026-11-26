/* Per ogni pagina e interfaccia scritta sul momento legge la sessione e mette l'utente connesso in Astro.locals.utente. */
import { defineMiddleware } from 'astro:middleware';
import { utenteDellaRichiesta } from './lib/accesso';

export const onRequest = defineMiddleware(async (contesto, prosegui) => {
  contesto.locals.utente = null;
  if (!contesto.isPrerendered && !contesto.url.pathname.startsWith('/api/accesso')) {
    contesto.locals.utente = await utenteDellaRichiesta(contesto.request.headers);
  }
  return prosegui();
});

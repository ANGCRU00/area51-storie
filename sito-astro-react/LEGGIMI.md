# Demo: la home di Area 51 con Astro + React

Stessa demo di `../sito-astro` (che usa Solid), con le tre isole riscritte in **React 19**. Serve per confrontare le due scelte.
Il sito attuale (`../sito`) non viene toccato.

- `src/components/isole/`: le isole in React: `Carrello.tsx`, `StatoNegozio.tsx`, `NuoviArrivi.tsx`.
- Tutto il resto (pagine, sezioni, parti fisse, `scripts/prepara.mjs`) è identico alla versione Solid.

Comandi (dalla cartella `sito-astro-react`): `npm install` la prima volta, poi `npm run dev`
oppure `npm run build` e `npm run preview`. Nella pagina, il pulsante "Mostra le isole (React)" evidenzia le isole.

Peso del JavaScript delle isole (compresso, come lo scarica il browser), misurato il 25/11/2026:
Solid circa 12 KB, React circa 72 KB. L'HTML della pagina è lo stesso: le schede sono già scritte nella pagina in entrambi i casi.

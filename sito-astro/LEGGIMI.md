# Demo: la home di Area 51 con Astro + Solid

Prova per capire la differenza con il sito attuale (`../sito`). Il sito attuale non viene toccato.

- `src/pages/index.astro`: la home, cioè l'elenco delle sezioni.
- `src/layouts/Base.astro`: testa, testata, piede e script comuni, scritti una volta per tutte le pagine.
- `src/components/isole/`: le **isole** in Solid, gli unici pezzi con JavaScript proprio: `Carrello.tsx` (pulsante in testata),
  `StatoNegozio.tsx` (aperto/chiuso in diretta), `NuoviArrivi.tsx` (pulsanti e schede di Nuovi arrivi / Prossime uscite).
- `src/components/Catalogo.astro`, `Eventi.astro`: sezioni costruite con i dati al momento della costruzione del sito.
- `src/components/statici/`: le parti fisse, ricavate in automatico dalla home attuale da `scripts/prepara.mjs`.

Comandi (dalla cartella `sito-astro`): `npm install` la prima volta, poi `npm run dev` (anteprima che si aggiorna mentre si modifica)
oppure `npm run build` e `npm run preview` (versione finale). Nella pagina, il pulsante "Mostra le isole" evidenzia le isole.

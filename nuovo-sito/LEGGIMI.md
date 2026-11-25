# Nuovo sito della Fumetteria Area 51

Astro 7 (pagine) + React 19 (isole) pubblicato sui **Workers di Cloudflare**, con database **D1** e file su **R2**.
Niente Tailwind: ogni componente ha il suo CSS. Analisi tecnica completa: vedi CLAUDE.md, sezione "Nuovo sito".

## Stato: fase 1 (base del progetto)

- Layout comune scritto una volta per tutte le pagine (`src/layouts/Base.astro`): simboli SVG, sfondo con il sistema solare,
  testata con la navicella del menu, ricerca, menu da telefono, piede.
- Isole React in testata: contatore del carrello e dei preferiti (stesse chiavi di localStorage del sito attuale).
- `/api/stato`: controlla che il sito raggiunga D1 e R2.
- Home provvisoria e pagina 404. Le altre pagine arrivano dalla fase 2.

## Struttura

| Cartella | Contenuto |
|---|---|
| `src/pages/` | le pagine (`index.astro`, `404.astro`) e le interfacce (`api/stato.ts`) |
| `src/layouts/Base.astro` | testa del documento e parti comuni |
| `src/components/comuni/` | `Simboli`, `Sfondo`, `Testata`, `Piede` |
| `src/components/isole/` | isole React, ognuna con il suo `.module.css` |
| `src/stili/` | `variabili.css` (colori, caratteri, misure, ombre) e `base.css` (regole comuni) |
| `src/lib/negozio.ts` | carrello e preferiti sul dispositivo |
| `migrazioni/` | modifiche al database D1, in ordine |
| `public/` | file serviti così come sono (caratteri) |

## Comandi (dalla cartella `nuovo-sito`)

```
npm install                                         # la prima volta
npx wrangler d1 migrations apply area51 --local     # crea le tabelle nel database di prova locale
npm run dev                                         # anteprima che si aggiorna mentre si modifica (http://localhost:4321)
npm run preview                                     # versione finale, come sul Worker (http://localhost:8787)
```

In locale D1 e R2 sono simulati nella cartella `.wrangler` (esclusa da git): non serve un account Cloudflare.

## Pubblicare su Cloudflare (la prima volta)

Servono un account Cloudflare intestato al negozio (lo crea Angelo) e questi passi, da fare una volta:

```
npx wrangler login                          # accesso all'account dal browser
npx wrangler d1 create area51               # copiare il database_id che stampa in wrangler.jsonc
npx wrangler r2 bucket create area51-file
npx wrangler d1 migrations apply area51 --remote
npm run deploy                              # pubblica su https://area51.<account>.workers.dev
```

## Regole

- Credenziali (Starshop, email) solo nei segreti del Worker (`npx wrangler secret put NOME`), mai nel codice o nel repository.
- Colori e misure solo dalle variabili di `src/stili/variabili.css`.
- Ogni pagina deve funzionare da telefono (390 px) senza scorrimento orizzontale.

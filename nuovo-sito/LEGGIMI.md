# Nuovo sito della Fumetteria Area 51

Astro 7 (pagine) + React 19 (isole) pubblicato sui **Workers di Cloudflare**, con database **D1** e file su **R2**.
Niente Tailwind: ogni componente ha il suo CSS. Analisi tecnica completa: vedi CLAUDE.md, sezione "Nuovo sito".

## Stato: fase 3 (database)

- **Fase 1**: layout comune (`src/layouts/Base.astro`: simboli, sfondo, testata con navicella, ricerca, menu da telefono, piede),
  contatori di carrello e preferiti, `/api/stato` (controllo di D1 e R2).
- **Fase 2**: home completa (apertura con stato del negozio in diretta, nastro, novità e prossime uscite, club, eventi),
  `/negozio` (orari da `src/lib/orari.ts`, Carta della Cultura, modulo **Chiedicelo** che salva in D1 tramite `/api/chiedicelo`),
  `/privacy` e `/condizioni` (testi provvisori del sito attuale, da completare).
- **Fase 3**: tabelle D1 descritte con **Drizzle** in `src/db/schema.ts` (`uscite`, `articoli`, `richieste`); migrazioni generate
  in `migrazioni/` con `npm run db:genera`. Trasferiti da Supabase **solo i dati arrivati dall'API Starshop**: 537 uscite e 1 articolo,
  con 397 copertine in R2 (chiave `copertine/<file>`, servite da `/file/copertine/<file>`).
- **Dati provvisori**: novità ed eventi della home vengono da `../sito/dati/*.js` tramite `scripts/dati-provvisori.mjs`
  (lanciato da `npm run dev` e `npm run build`). Dalla fase 3/4 arriveranno da D1 e lo script si toglie.

## Struttura

| Cartella | Contenuto |
|---|---|
| `src/pages/` | le pagine (`index`, `negozio`, `privacy`, `condizioni`, `404`) e le interfacce (`api/stato.ts`, `api/chiedicelo.ts`) |
| `src/layouts/Base.astro` | testa del documento e parti comuni |
| `src/components/comuni/` | `Simboli`, `Sfondo`, `Testata`, `Piede`, `Percorso`, `Documento` (pagine di testo) |
| `src/components/home/` | sezioni della home |
| `src/components/isole/` | isole React, ognuna con il suo `.module.css` |
| `src/stili/` | `variabili.css` (colori, caratteri, misure, ombre) e `base.css` (regole comuni) |
| `src/lib/` | `negozio.ts` (carrello e preferiti sul dispositivo), `orari.ts` (orari del negozio), `api.ts` (aiuti per le interfacce) |
| `src/db/` | tabelle (`schema.ts`) e accesso al database (`index.ts`) |
| `migrazioni/` | modifiche al database D1, generate da Drizzle: non scriverle a mano |
| `importazione/` | dati esportati da Supabase e copertine (esclusa da git) |
| `public/` | file serviti così come sono (caratteri) |

## Comandi (dalla cartella `nuovo-sito`)

```
npm install                                         # la prima volta
npm run db:locale                                   # crea le tabelle nel database di prova locale
npm run importa                                     # copia uscite, articoli e copertine (serve la cartella importazione/)
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
npx wrangler d1 execute area51 --remote --file importazione/dati.sql   # uscite e articoli trasferiti
# copertine: caricare i file di importazione/copertine/ nel bucket area51-file con chiave copertine/<file>
npm run deploy                              # pubblica su https://area51.<account>.workers.dev
```

## Regole

- Credenziali (Starshop, email) solo nei segreti del Worker (`npx wrangler secret put NOME`), mai nel codice o nel repository.
- Colori e misure solo dalle variabili di `src/stili/variabili.css`.
- Ogni pagina deve funzionare da telefono (390 px) senza scorrimento orizzontale.

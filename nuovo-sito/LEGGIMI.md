# Nuovo sito della Fumetteria Area 51

Astro 7 (pagine) + React 19 (isole) pubblicato sui **Workers di Cloudflare**, con database **D1** e file su **R2**.
Niente Tailwind: ogni componente ha il suo CSS. Analisi tecnica completa: vedi CLAUDE.md, sezione "Nuovo sito".

## Stato: fase 4 (catalogo dal database)

- **Fase 1**: layout comune (`src/layouts/Base.astro`: simboli, sfondo, testata con navicella, ricerca, menu da telefono, piede),
  contatori di carrello e preferiti, `/api/stato` (controllo di D1 e R2).
- **Fase 2**: home completa (apertura con stato del negozio in diretta, nastro, novità e prossime uscite, club, eventi),
  `/negozio` (orari da `src/lib/orari.ts`, Carta della Cultura, modulo **Chiedicelo** che salva in D1 tramite `/api/chiedicelo`),
  `/privacy` e `/condizioni` (testi provvisori del sito attuale, da completare).
- **Fase 3**: tabelle D1 descritte con **Drizzle** in `src/db/schema.ts` (`uscite`, `articoli`, `richieste`); migrazioni generate
  in `migrazioni/` con `npm run db:genera`. Trasferiti da Supabase **solo i dati arrivati dall'API Starshop**: 537 uscite e 1 articolo,
  con 397 copertine in R2 (chiave `copertine/<file>`, servite da `/file/copertine/<file>`).
- **Fase 4**: catalogo da D1 (decisione di Angelo: **solo magazzino + uscite**, niente cataloghi editori): `/catalogo` (manga e fumetti),
  `/tcg`, `/giochi`, `/figure`, `/warhammer`, `/gadget`, `/uscite`, scheda `/prodotto/<EAN o codice Starshop>`. Regole comuni in
  `src/lib/prodotti.ts`, componenti in `src/components/prodotti/` (`Elenco` con filtri GET, `Scheda`, `AzioniCarrello`). Home: "Appena usciti"
  e "Prossime uscite" da D1.
- **Genere e 18+**: tabella `serie` (chiave = codice padre Starshop). Per i manga le proposte arrivano da AniList con
  `node scripts/generi-anilist.mjs` (aggiunge `--tutte` per rifare anche le serie già cercate; le serie confermate dal gestore non si
  toccano). I titoli per adulti sono nascosti finché il visitatore non conferma di essere maggiorenne (cookie `area51_adulti`).
- **Dati provvisori**: solo gli eventi della home, da `../sito/dati/eventi.js` tramite `scripts/dati-provvisori.mjs` (fino alla fase 8).

## Account (fase 5)

- **Better Auth** con email e password, email confermata e recupero della password (`src/lib/accesso.ts`, interfacce in `/api/accesso/*`).
  Pagine `/accedi`, `/registrati`, `/recupera-password`, `/nuova-password`, `/account`.
- **Pagina account** (`/account`): colonna con nome e sezioni, a destra una sezione alla volta (`#prenotazioni`,
  `#preferiti`, `#serie`, `#dati`). I miei dati: nome e telefono (`/api/profilo`), cambio password ed eliminazione
  dell'account (Better Auth `change-password` e `delete-user`, con la password). L'email non si cambia dal sito.
- **Preferiti e serie seguite**: il browser ne tiene una copia (`src/lib/negozio.ts`); per chi ha fatto l'accesso
  sono salvati anche in D1 (tabelle `preferiti` e `serie_seguite`, `/api/raccolte`). Al primo accesso da un dispositivo
  le liste si uniscono, poi comanda quella dell'account; uscendo dall'account spariscono dal dispositivo.
  Ogni serie mostra la prossima uscita (per codice della serie Starshop, altrimenti per nome ed editore).
- **Prenotazioni** legate all'account: `/api/prenotazioni` (solo clienti connessi). **Ogni prodotto del sito si prenota**
  (magazzino, prossime uscite, uscite già uscite, esauriti): non c'è più il carrello, in testata c'è "Prenotazioni".
  Massimo 30 prenotazioni aperte per cliente. Chi non trova un prodotto usa "Non lo trovi? Chiedicelo"
  (in fondo ai risultati del catalogo, `/negozio?cosa=testo#chiedicelo` precompila il modulo).
- **Foto del profilo**: dalla pagina account, ritagliata a 256 px nel browser, in R2 `profili/<utente>-<istante>.jpg`
  (`/api/profilo/foto`, solo la propria; la chiave si accetta solo se contiene l'id dell'utente). Si cancella con l'account.
- **Email** con Resend (`src/lib/email.ts`): senza chiave le email si stampano nel terminale, così si provano i flussi in locale.
- **Segreti**: in locale nel file `.dev.vars` (escluso da git; contiene `BETTER_AUTH_SECRET`). Online:
  `npx wrangler secret put BETTER_AUTH_SECRET`, `npx wrangler secret put RESEND_API_KEY`, e le variabili
  `BETTER_AUTH_URL` (indirizzo del sito) ed `EMAIL_MITTENTE` (es. `Area 51 Fumetteria <noreply@dominio.it>`).
- **Gestore**: dopo che si è registrato, gli si dà il ruolo con
  `npx wrangler d1 execute area51 --remote --command "UPDATE utenti SET ruolo = 'gestore' WHERE email = '...'"`.
  Le interfacce del gestore usano `soloGestore` (`src/lib/permessi.ts`).

## Area gestore (fase 7)

- Pagina `/gestore`, solo per il ruolo gestore. Sezioni: Prenotazioni (cambio di stato con email al cliente),
  Richieste Chiedicelo, Uscite (visibile e data limite), Genere e 18+ delle serie (conferma della proposta AniList).
- Interfacce `/api/gestore/*`, tutte con `soloGestore`. Logica in `src/lib/gestore/`, isole in `src/components/isole/gestore/`.
- Avviso al negozio per nuove prenotazioni e richieste: impostare la variabile `EMAIL_NEGOZIO` (online in
  `wrangler.jsonc` o come segreto). Senza, non parte nessun avviso: le novità si vedono nell'area gestore.

## Uscite da Starshop (fase 6)

- Un **Worker separato con Cron** aggiorna ogni notte la tabella `uscite` (prossimi 60 giorni) e scarica in R2 le
  copertine mancanti. Il suo codice sta in `privato/worker-starshop/` (esclusa da git: il repository è pubblico),
  con il suo `LEGGIMI.md` per provarlo e pubblicarlo. Non tocca `visibile` e `data_limite`, che decide il gestore.
- Segreti del Worker: `STARSHOP_USER`, `STARSHOP_PASSWORD` (in locale nel suo `.dev.vars`, online con `wrangler secret put`).
- Colonne nuove di `uscite` (migrazione 0005): `ristampa` (ristampa o arretrato) e `origine` (paese dell'opera,
  dal tipo di fumetto). La scheda prodotto le mostra come "Tipo di uscita" e "Origine".
- Serve il piano Workers a pagamento (tempo di CPU e numero di richieste per esecuzione).

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
npx wrangler d1 execute area51 --remote --file importazione/serie.sql  # generi e 18+ delle serie
# copertine: caricare i file di importazione/copertine/ nel bucket area51-file con chiave copertine/<file>
npm run deploy                              # pubblica su https://area51.<account>.workers.dev
```

## Regole

- Credenziali (Starshop, email) solo nei segreti del Worker (`npx wrangler secret put NOME`), mai nel codice o nel repository.
- Colori e misure solo dalle variabili di `src/stili/variabili.css`.
- Ogni pagina deve funzionare da telefono (390 px) senza scorrimento orizzontale.

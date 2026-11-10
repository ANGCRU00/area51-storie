# Fumetteria Area 51 – grafiche Instagram e sito

Cartella di lavoro di Angelo (Barletta) per la Fumetteria Area 51: manga, fumetti, carte TCG, figure, Warhammer, tornei.
Si parla in italiano. Tutti i testi visibili sono in italiano.

## Contenuto della cartella

| Percorso | Cosa è |
| --- | --- |
| `index.html` | Generatore di post e storie Instagram (pagina unica, font incorporati). Online su GitHub Pages: repo `ANGCRU00/area51-uscite`, branch `main` → https://angcru00.github.io/area51-uscite/ |
| `generatore-sorgenti/` | Sorgente del generatore: `merged.template.html` con i segnaposto `%%BLACK%%` / `%%BOLD%%` per i font. `python build.py` riscrive `../index.html`. **Modifica il template, non `index.html`.** |
| `sito/` | Nuovo sito della fumetteria (prototipo HTML + Tailwind). `index.html` = home fatta. `catalogo.html` = Manga & Fumetti fatto (prodotti DI ESEMPIO nell'array `SERIE` dello script; i link vanno a `prodotto.html?id=N`, ancora da fare). Da fare: scheda prodotto e le altre pagine. |
| `sito/sorgenti/` | Config Tailwind 3.4 + `input.css`. Dopo aver cambiato classi: `npx tailwindcss@3.4.17 -c sorgenti/tailwind.config.js -i sorgenti/input.css -o css/style.css --minify` (dalla cartella `sito`, serve `@tailwindcss/forms`). |
| `stitch/` | Materiale per Google Stitch: screenshot proposte, alieno e disco volante PNG, `prompt-stitch.txt`. |
| `banner-griglia*/`, `tessera-punti/` | Banner a griglia Instagram (3 tessere 1080×1440) e tessera punti 85×55 mm (PDF tipografia). |

## Stile Area 51 (vale per tutto)

- Tema UFO / Area 51: cielo notturno, disco volante con alieno nella cupola, raggio lime.
- Colori: lime `#B9E62E`, viola `#5B21B6`, inchiostro `#140C2B`, notte `#070514` → `#1A0E3D` → `#3D1775`, testo chiaro `#F1ECFB`, testo secondario `#B3A9CC`, bordi `#3A2F5E`.
- Font: Archivo. Titoli Archivo Black Expanded (wght 900, wdth 125); testo Archivo Bold.
- Alieno: forma "fumetto" lime con occhi neri inclinati (path in `sito/index.html`, `<symbol id="alieno">`). Disco volante: `<symbol id="disco">` (viewBox `-345 -175 690 290`, non stringerlo o si taglia).
- Stile fumetto: etichette leggermente ruotate, ombre nette spostate (viola o inchiostro), bordi lime luminosi.
- Niente emoji, niente pianeti sopra i contenuti (Angelo li ha bocciati; ora c'è un "sistema solare" nello sfondo, dietro ai contenuti: simboli `p-luna`, `p-gioviano`, `p-terra`, `p-marte`, `p-fasce`, `p-saturno`, `p-urano`, `p-nettuno`, `p-ast1..5`; ogni `.corpo` viaggia lungo un'onda calcolata dallo script "sistema solare" in fondo alla pagina ed esce/rientra dai lati: `data-vel` px/s, `data-verso` 1/-1, `data-amp`/`data-onde`/`data-fase` per la curva, `data-giro` rotazione degli asteroidi, `data-x` posizione iniziale e ferma per "riduci movimento"; gli asteroidi usano la stessa onda della `.fascia` (due linee) così ci stanno sopra. NON farli scorrere dritti come un nastro: Angelo l'ha bocciato), niente dati inventati spacciati per veri: usare segnaposto tipo `[PREZZO]`, `[ORARI LUN-SAB]`.

## Dati del negozio

- Indirizzo: Viale G. Falcone e P. Borsellino, 35 – 76121 Barletta (BT)
- Telefono: 0883 884567 (fisso: non usarlo per link WhatsApp)
- Ritiro e pagamento in negozio, nessuna spedizione.
- Orari: non ancora forniti.
- Sito attuale (compilato, senza sorgente): https://app-fumetteria-area-51-78465e.gitlab.io

## Sito: decisioni prese

- Direzione scelta: **Proposta 1 · Notte stellata** (esiste anche una Proposta 2 chiara, accantonata per ora).
- Pagina catalogo Manga & Fumetti:
  - filtri in un **pannello a scomparsa** aperto da una linguetta lime "FILTRI" **fissata al bordo sinistro dello schermo**, con l'alieno appoggiato sopra;
  - dentro: Genere, Lunghezza serie, Prezzo massimo, Editore, Edizione, Età consigliata, pulsanti Azzera / Mostra risultati;
  - sopra la griglia: chip Tipo (Manga, Fumetti italiani, Supereroi, Graphic novel) e Stato (Novità, Preordini, Disponibili in negozio), ordinamento, filtri attivi come chip rimovibili;
  - griglia **4 colonne × 4 righe = 16 prodotti per pagina** (2 per riga da telefono), paginazione;
  - disco volante a destra del titolo, raggio mai sopra il testo.
- Scheda prodotto: copertina grande, prezzo, disponibilità ("Disponibile in negozio" / "Esaurito, ordinabile"), Standard/Variant, griglia dei volumi della serie (lime = disponibile), "Prenota" con nome e telefono.
- Altre pagine già progettate in Stitch (da portare in HTML): Eventi & Tornei, Area 51 Club, Chiedicelo, Il negozio.
- Ogni pagina deve funzionare da telefono (390 px) senza scorrimento orizzontale.

## Dove siamo (ultimo aggiornamento 10/11/2026)

- Fatto: `sito/index.html` (home) e `sito/catalogo.html` (Manga & Fumetti), entrambi verificati a 390 e 1440 px.
- Navicella nel menu: si muove con una molla (inerzia, si inclina, oscilla quando cambia direzione). Valori approvati da Angelo: prontezza `0.045`, attrito `0.80`, inclinazione max 15°. Stesso codice in tutte le pagine.
- Regola in `sorgenti/input.css`: `[hidden]{display:none !important}` (senza, gli elementi `hidden` con classi flex restavano visibili).
- Ogni nuova pagina copia da `catalogo.html`: simboli SVG (alieno, disco, pianeti, asteroidi), sfondo con sistema solare, testata con navicella, piede, e i due script in fondo.
- **Prossimo passo: `sito/prodotto.html`** (scheda prodotto, vedi "Sito: decisioni prese"), letta da `?id=N` del catalogo. Poi Eventi & Tornei, Area 51 Club, Chiedicelo, Il negozio.
- Anteprima: dalla cartella `sito` lanciare `python -m http.server 8751` e aprire http://127.0.0.1:8751/ (da `file://` funziona quasi tutto, ma meglio il server).

## Generatore: note

- Linguette: uscite (post carosello 1080×1350, layout "Raggio e schermo"), nuovo post, torneo, chiusura, evento (stile "Rapimento UFO", sottotitolo facoltativo).
- Liste titoli: va a destra solo ciò che sta dopo `|`. Numeri dopo la barra: 3+ consecutivi → "DAL 3 AL 6", altri → "1-3-5" (funzione `sistemaNumeri`).
- Le foto non vengono mai tagliate. I testi si salvano in localStorage, le foto no.
- Per pubblicare: caricare `index.html` aggiornato nel repo `ANGCRU00/area51-uscite`.

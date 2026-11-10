# Fumetteria Area 51 – grafiche Instagram e sito

Cartella di lavoro di Angelo (Barletta) per la Fumetteria Area 51: manga, fumetti, carte TCG, figure, Warhammer, tornei.
Si parla in italiano. Tutti i testi visibili sono in italiano.

## Contenuto della cartella

| Percorso | Cosa è |
| --- | --- |
| `index.html` | Generatore di post e storie Instagram (pagina unica, font incorporati). Online su GitHub Pages: repo `ANGCRU00/area51-uscite`, branch `main` → https://angcru00.github.io/area51-uscite/ |
| `generatore-sorgenti/` | Sorgente del generatore: `merged.template.html` con i segnaposto `%%BLACK%%` / `%%BOLD%%` per i font. `python build.py` riscrive `../index.html`. **Modifica il template, non `index.html`.** |
| `sito/` | Nuovo sito della fumetteria (prototipo HTML + Tailwind). `index.html` = home fatta. `catalogo.html` = Manga & Fumetti fatto (prodotti DI ESEMPIO nell'array `SERIE` dello script; i link vanno a `prodotto.html?id=N`, ancora da fare). `tcg.html` = giochi di carte (Magic, Pokémon, Riftbound), fatta sul modello del catalogo: prodotti DI ESEMPIO con nomi generici e segnaposto `[ESPANSIONE]`, link a `prodotto.html?cat=tcg&id=N`. Nel menu la voce si chiama **TCG** (non più "Carte"). `figure.html` = **Figure & Funko** (voce di menu rinominata da "Figure"), stesso modello: chip Linea (Funko Pop, Action figure) e Stato; la colonna filtri mostra il gruppo della linea scelta, oppure entrambi: **Versione** per i Funko (standard, Chase, esclusiva, glow in the dark, flocked, metallic) e **Scala** per le action figure (1:6 circa 30 cm, 1:10 circa 18 cm, 1:12 circa 15 cm). Prodotti DI ESEMPIO con `[PERSONAGGIO]`; niente filtri Marca o Franchise finché il negozio non fornisce i dati veri (Angelo non sa ancora i marchi). Nomi di versioni e scale trovati su siti di rivenditori, non ufficiali. Da fare: scheda prodotto e le altre pagine. |
| `sito/sorgenti/` | Config Tailwind 3.4 + `input.css`. Dopo aver cambiato classi: `npx tailwindcss@3.4.17 -c sorgenti/tailwind.config.js -i sorgenti/input.css -o css/style.css --minify` (dalla cartella `sito`, serve `@tailwindcss/forms`). |
| `stitch/` | Materiale per Google Stitch: screenshot proposte, alieno e disco volante PNG, `prompt-stitch.txt`. |
| `banner-griglia*/`, `tessera-punti/` | Banner a griglia Instagram (3 tessere 1080×1440) e tessera punti 85×55 mm (PDF tipografia). |

## Stile Area 51 (vale per tutto)

- Tema UFO / Area 51: cielo notturno, disco volante con alieno nella cupola, raggio lime.
- Colori: lime `#B9E62E`, viola `#5B21B6`, inchiostro `#140C2B`, notte `#070514` → `#1A0E3D` → `#3D1775`, testo chiaro `#F1ECFB`, testo secondario `#B3A9CC`, bordi `#3A2F5E`.
- Font: Archivo. Titoli Archivo Black Expanded (wght 900, wdth 125); testo Archivo Bold.
- Filtri: la linguetta FILTRI e l'intestazione del pannello usano il **radar** (`<symbol id="radar">`, scelto da Angelo tra raggio a imbuto, radar e cursori), non l'alieno. L'alieno resta per logo, titoli e stati vuoti: usarlo ovunque stanca.
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
  - filtri: da **1280 px in su una colonna sempre visibile a sinistra** (larga 320 px, resta ferma mentre si scorre e si ferma sopra il piede); sotto 1280 px (tablet e telefono) il **pannello a scomparsa** aperto da una linguetta lime "FILTRI" **fissata al bordo sinistro dello schermo**, con l'alieno appoggiato sopra. È lo stesso `<aside id="filtri-pannello">`: lo script "Pannello filtri" lo mostra o lo nasconde al cambio di larghezza;
  - dentro: Cerca (titolo o autore, senza accenti), Genere (14 voci, con Romance e Azione), Serie (volume unico / in corso / conclusa), Editore, Edizione, Età consigliata, pulsanti Azzera / Mostra risultati. Tolti per scelta di Angelo: Lunghezza serie a fasce e Prezzo massimo. Il campo `autore` non c'è ancora nei dati di esempio: la ricerca lo usa appena un prodotto lo ha;
  - sopra la griglia: chip Tipo (Manga, Fumetti italiani, Supereroi, Graphic novel) e Stato (Novità, Preordini, Disponibili in negozio), ordinamento, filtri attivi come chip rimovibili;
  - griglia **4 colonne × 4 righe = 16 prodotti per pagina** (2 per riga da telefono), paginazione;
  - disco volante a destra del titolo, raggio mai sopra il testo.
- Scheda prodotto: copertina grande, prezzo, disponibilità ("Disponibile in negozio" / "Esaurito, ordinabile"), Standard/Variant, griglia dei volumi della serie (lime = disponibile), "Prenota" con nome e telefono.
- Altre pagine già progettate in Stitch (da portare in HTML): Eventi & Tornei, Area 51 Club, Chiedicelo, Il negozio.
- Ogni pagina deve funzionare da telefono (390 px) senza scorrimento orizzontale.

## Dove siamo (ultimo aggiornamento 10/11/2026)

- Fatto: `sito/index.html` (home), `sito/catalogo.html` (Manga & Fumetti) e `sito/tcg.html` (TCG), verificati a 390 e 1440 px. TCG: chip Gioco (Magic, Pokémon, Riftbound, Yu-Gi-Oh!) e Stato in alto, nella colonna filtri Cerca, Prodotto e Lingua. **Prodotto cambia con il gioco scelto** (ogni gioco ha i suoi nomi, nell'oggetto `GIOCHI` dello script; senza gioco scelto compare l'invito a sceglierne uno): Magic = bustine, bundle e fat pack, box, mazzi precostruiti, prerelease, singole, accessori; Pokémon = bustine, display, Elite Trainer Box, singole, accessori; Riftbound = bustine, booster display, bundle, Champion Deck, Proving Grounds, singole, accessori (solo inglese); Yu-Gi-Oh! = bustine, booster box, Structure Deck, Starter Deck, Tin, singole, accessori. Nomi trovati su negozi online italiani, non su siti ufficiali: da confrontare col listino del fornitore. Lingua mostra solo quelle dei giochi scelti. Fascia "Carte in tavola" che rimanda a Eventi.
- Navicella nel menu: si muove con una molla (inerzia, si inclina, oscilla quando cambia direzione). Valori approvati da Angelo: prontezza `0.045`, attrito `0.80`, inclinazione max 15°. Stesso codice in tutte le pagine.
- Testata: il menu completo compare da **1280 px** (classe `xl:`), sotto c'è il pulsante del menu da telefono. Prima era da 1024 px e a quella larghezza la testata sporgeva di circa 40 px a destra. Stesso soglia della colonna filtri.
- Regola in `sorgenti/input.css`: `[hidden]{display:none !important}` (senza, gli elementi `hidden` con classi flex restavano visibili).
- Ogni nuova pagina copia da `catalogo.html`: simboli SVG (alieno, disco, pianeti, asteroidi), sfondo con sistema solare, testata con navicella, piede, e i due script in fondo.
- **Prossimo passo: `sito/prodotto.html`** (scheda prodotto, vedi "Sito: decisioni prese"), letta da `?id=N` del catalogo. Poi Eventi & Tornei, Area 51 Club, Chiedicelo, Il negozio.
- Anteprima: dalla cartella `sito` lanciare `python -m http.server 8751` e aprire http://127.0.0.1:8751/ (da `file://` funziona quasi tutto, ma meglio il server).

## Generatore: note

- Linguette: uscite (post carosello 1080×1350, layout "Raggio e schermo"), nuovo post, torneo, chiusura, evento (stile "Rapimento UFO", sottotitolo facoltativo).
- Liste titoli: va a destra solo ciò che sta dopo `|`. Numeri dopo la barra: 3+ consecutivi → "DAL 3 AL 6", altri → "1-3-5" (funzione `sistemaNumeri`).
- Le foto non vengono mai tagliate. I testi si salvano in localStorage, le foto no.
- Per pubblicare: caricare `index.html` aggiornato nel repo `ANGCRU00/area51-uscite`.

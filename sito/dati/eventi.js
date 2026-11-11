/* Calendario degli eventi (DI ESEMPIO: date, orari, quote e posti sono inventati; calendario 2026).
   Colonne: linea (carte | serate | ruolo), gioco, tipo di evento, titolo, giorno, numero, mese, ora, quota in euro (0 = gratis),
   posti occupati, posti totali, formato, in palio, descrizione. In ordine di data. Lo usano eventi.html e la home. */
window.EVENTI_DATI = [
    ['carte', 'magic', 'torneo', 'Torneo Commander Weekend', 'Sab', 14, 'Nov', '17:30', 5, 18, 24, 'Commander Format', '1 bustina promo foil per ogni partecipante + montepremi ai primi.', 'Regolamento multiplayer a 4 giocatori, casual e fun.'],
    ['carte', 'pokemon', 'torneo', 'Torneo Standard League Challenge', 'Dom', 15, 'Nov', '16:00', 6, 14, 16, 'Standard', 'Playmat ufficiale esclusivo + bustine Pokémon TCG.', 'Formato Standard ufficiale, gironi all\'italiana + top cut.'],
    ['carte', 'riftbound', 'torneo', 'Nexus Night Riftbound', 'Mer', 18, 'Nov', '20:30', 5, 7, 12, 'Costruito', 'Bustine in premio ai primi tre classificati.', 'Serata settimanale: porta il tuo mazzo, ti aiutiamo a trovare un avversario.'],
    ['carte', 'magic', 'torneo', 'Friday Night Magic · Standard', 'Ven', 20, 'Nov', '20:00', 8, 15, 24, 'Standard', 'Carte promo FNM e punti stagione per i migliori.', '4 turni di svizzera, mazzi a 60 carte.'],
    ['carte', 'pokemon', 'torneo', 'Pokémon League del venerdì', 'Ven', 20, 'Nov', '17:30', 3, 8, 16, 'Lega settimanale', 'Un bollino per ogni partecipazione, premio finale a chi li completa.', 'Aperto a tutti, dai principianti ai più esperti.'],
    ['serate', '', '', 'Serata Carcassonne e dintorni', 'Sab', 21, 'Nov', '21:00', 0, 9, 12, 'Giochi da tavolo', 'Il vincitore sceglie il gioco della prossima serata.', 'Tavoli da 2 a 5 giocatori, regole spiegate sul momento.'],
    ['ruolo', '', '', 'Dungeons & Dragons · La miniera perduta', 'Dom', 22, 'Nov', '15:00', 5, 4, 5, 'D&D 5e', 'Una storia da raccontare e un tesoro da trovare.', 'Avventura per personaggi di livello 1, schede pronte per chi è alla prima volta.'],
    ['carte', 'magic', 'draft', 'Draft Magic · Tarkir: Dragonstorm', 'Ven', 27, 'Nov', '20:00', 20, 6, 8, 'Booster Draft', 'Premi in bustine in base ai risultati.', '3 turni, bustine incluse nella quota.'],
    ['carte', 'pokemon', 'prerelease', 'Prerelease Pokémon · Fiamme Spettrali', 'Sab', 28, 'Nov', '15:00', 30, 10, 16, 'Build & Battle', 'Kit prerelease con bustine, promo e dado esclusivo.', 'Costruisci il mazzo dalle carte nuove e sfida gli altri giocatori in anteprima.'],
    ['serate', '', '', 'Serata giochi cooperativi', 'Sab', 28, 'Nov', '21:00', 0, 11, 16, 'Giochi da tavolo', 'Vincete tutti insieme, o perdete insieme.', 'Pandemic, Forbidden Island e altri: si gioca in squadra contro il gioco.'],
    ['carte', 'riftbound', 'prerelease', 'Pre-Rift Riftbound · Origins', 'Dom', 29, 'Nov', '15:00', 25, 9, 16, 'Sealed', 'Kit prerelease con bustine e promo.', 'Apri le bustine, costruisci il mazzo e gioca in anteprima.'],
    ['ruolo', '', '', 'Serata di prova gioco di ruolo', 'Dom', 29, 'Nov', '18:00', 0, 5, 8, 'Per principianti', 'Nessun premio: solo una prima avventura.', 'Mai giocato? Ti prestiamo scheda e dadi e ti guidiamo noi.'],
    ['carte', 'magic', 'prerelease', 'Prerelease Magic · Edge of Eternities', 'Ven', 4, 'Dic', '20:00', 30, 17, 24, 'Sealed', 'Kit prerelease con bustine, promo e dado esclusivo.', 'Costruisci il mazzo da 6 bustine e gioca 3 turni.'],
    ['serate', '', '', 'Serata Il richiamo di Cthulhu', 'Sab', 5, 'Dic', '21:00', 3, 4, 6, 'Gioco di ruolo horror', 'Chi resta sano di mente.', 'Investigatori, misteri e qualche punto di sanità mentale da perdere.'],
    ['ruolo', '', '', 'Dungeons & Dragons · Il drago di Cenere', 'Dom', 6, 'Dic', '15:00', 5, 3, 5, 'D&D 5e', 'Fama, gloria e un tesoro da dragone.', 'Seconda avventura per personaggi di livello 3.']
  ];

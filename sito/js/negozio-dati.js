/* Dati del negozio che compaiono nelle pagine Privacy e Condizioni di vendita.
   Ogni voce vuota lascia visibile il segnaposto tra parentesi quadre; appena scrivi un valore, quel segnaposto
   viene sostituito in tutte le pagine (gli elementi con data-n="nome della voce"). Compila solo con dati veri e
   decisi dal titolare: i testi legali vanno comunque fatti rivedere da un commercialista o consulente. */
window.A51_NEGOZIO = {
  ragione_sociale: '',          // es. nome dell'impresa o della società
  partita_iva: '',
  email_negozio: '',            // email per i clienti
  email_privacy: '',            // email per le richieste sui dati (può essere la stessa)
  data_aggiornamento: '',       // es. 12 novembre 2026
  conservazione_richieste: '',  // per quanto tempo si tengono le richieste Chiedicelo
  conservazione_prenotazioni: '',
  conservazione_tessera: '',    // dopo l'ultima attività della tessera
  giorni_ritiro: '',            // per quanti giorni dopo l'uscita si tiene un titolo prenotato
  ritiro_non_ritirato: '',      // cosa succede a chi non ritira
  caparra: '',                  // per quali titoli, quanto, e se si restituisce
  recesso: '',                  // recesso, rimborsi e garanzia
  livelli_regole: ''            // regole dei livelli del Club
};
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-n]').forEach(function (e) {
    var v = String(window.A51_NEGOZIO[e.dataset.n] || '').trim();
    if (v) e.textContent = v;
  });
});

/* Eventi dal database del negozio (tabella "eventi" di Supabase, vedi js/area51-db.js).
   Se il gestore ha pubblicato eventi futuri, window.EVENTI_DATI diventa quell'elenco; se non ce ne sono, o il database
   non risponde, resta il calendario di esempio di dati/eventi.js. Le pagine che usano gli eventi partono con
   A51Eventi.pronti(funzione), che aspetta la risposta (al massimo 2,5 secondi).
   Formato di ogni riga, uguale al calendario di esempio: linea, gioco, tipo, titolo, giorno, numero, mese, ora, quota,
   posti occupati (null = non noto), posti totali, formato, in palio, descrizione, id nel database, data ISO. */
(function () {
  var pronto = false, coda = [];
  var GIORNI = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'], MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  var NM = { Gen: 0, Feb: 1, Mar: 2, Apr: 3, Mag: 4, Giu: 5, Lug: 6, Ago: 7, Set: 8, Ott: 9, Nov: 10, Dic: 11 };
  function fine() { if (pronto) return; pronto = true; coda.splice(0).forEach(function (f) { f(); }); }
  function chiave(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function converti(r) {
    var p = r.data.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return [r.linea, chiave(r.gioco), chiave(r.tipo), r.titolo, GIORNI[d.getDay()], d.getDate(), MESI[d.getMonth()], r.ora, Number(r.quota) || 0,
      null, r.posti_totali, r.formato || '', r.palio || '', r.descrizione || '', r.id, r.data];
  }
  window.A51Eventi = {
    pronti: function (f) { if (pronto) f(); else coda.push(f); },
    /* data dell'evento in millisecondi: quella ISO se c'è, altrimenti il 2026 del calendario di esempio */
    quando: function (r) { return r[15] ? new Date(r[15] + 'T00:00:00').getTime() : new Date(2026, NM[r[6]], r[5]).getTime(); }
  };
  setTimeout(fine, 2500);
  if (!window.A51DB || !window.fetch) { fine(); return; }
  var o = new Date(), oggi = o.getFullYear() + '-' + ('0' + (o.getMonth() + 1)).slice(-2) + '-' + ('0' + o.getDate()).slice(-2);
  fetch(A51DB.url + '/rest/v1/eventi?select=*&pubblicato=eq.true&data=gte.' + oggi + '&order=data.asc,ora.asc', { headers: { apikey: A51DB.chiave, Authorization: 'Bearer ' + A51DB.chiave } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (righe) { if (righe.length) { window.EVENTI_DATI = righe.map(converti); window.EVENTI_DAL_DATABASE = true; } })
    .catch(function () {})
    .then(fine);
})();

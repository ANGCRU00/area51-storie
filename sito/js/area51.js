/* Area 51: dati dell'utente su QUESTO dispositivo (preferiti, carrello, serie seguite, iscrizioni agli eventi, nome e contatti).
   Niente account e niente server: tutto sta nel browser (localStorage; se è bloccato, solo finché la pagina resta aperta).
   Quando ci sarà un servizio per gli account, questo file è l'unico punto da collegare. Va caricato nell'<head>. */
(function () {
  var CH = { pref: 'area51-preferiti', car: 'area51-carrello', serie: 'area51-serie', iscr: 'area51-iscrizioni', prof: 'area51-profilo' };
  var memoria = {}, ascoltatori = [];
  var EDITORI = { star: 'Star Comics', jpop: 'J-POP', panini: 'Panini Comics' };

  function leggi(k, def) {
    try { var v = localStorage.getItem(k); if (v) return JSON.parse(v); } catch (e) { if (memoria[k] !== undefined) return memoria[k]; }
    return def;
  }
  function scrivi(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { memoria[k] = v; }
    cambiato();
  }
  function euro(x) { return Number(x).toFixed(2).replace('.', ',') + ' €'; }
  function testo(x) { return String(x == null ? '' : x).slice(0, 200); }
  // un articolo salvato: k chiave, t titolo, p prezzo (numero), l indirizzo della scheda, i copertina, e riga di dettaglio
  function pulisci(s) { return { k: testo(s.k), t: testo(s.t), p: Number(s.p) || 0, l: String(s.l == null ? '' : s.l).slice(0, 700), i: testo(s.i), e: testo(s.e) }; }

  /* ---------- Elenchi ---------- */
  function elenco(chiave) {
    return {
      tutti: function () { return leggi(chiave, []); },
      ha: function (k) { return leggi(chiave, []).some(function (x) { return x.k === k; }); },
      aggiungi: function (s) { var l = leggi(chiave, []); if (!l.some(function (x) { return x.k === s.k; })) { l.push(pulisci(s)); scrivi(chiave, l); } },
      togli: function (k) { scrivi(chiave, leggi(chiave, []).filter(function (x) { return x.k !== k; })); },
      toggle: function (s) { if (this.ha(s.k)) { this.togli(s.k); return false; } this.aggiungi(s); return true; }
    };
  }
  var pref = elenco(CH.pref);

  var carrello = {
    tutti: function () { return leggi(CH.car, []); },
    aggiungi: function (s, q) {
      var l = leggi(CH.car, []), x = l.filter(function (y) { return y.k === s.k; })[0];
      q = Math.max(1, Math.min(9, q || 1));
      if (x) x.q = Math.min(9, x.q + q); else { var n = pulisci(s); n.q = q; l.push(n); }
      scrivi(CH.car, l);
    },
    imposta: function (k, q) { var l = leggi(CH.car, []); l.forEach(function (x) { if (x.k === k) x.q = Math.max(1, Math.min(9, q)); }); scrivi(CH.car, l); },
    togli: function (k) { scrivi(CH.car, leggi(CH.car, []).filter(function (x) { return x.k !== k; })); },
    svuota: function () { scrivi(CH.car, []); },
    conta: function () { return leggi(CH.car, []).reduce(function (t, x) { return t + x.q; }, 0); },
    totale: function () { return leggi(CH.car, []).reduce(function (t, x) { return t + x.p * x.q; }, 0); }
  };

  // serie seguite: s nome della serie, e editore
  var serie = {
    tutti: function () { return leggi(CH.serie, []); },
    ha: function (s, e) { return leggi(CH.serie, []).some(function (x) { return x.s.toLowerCase() === s.toLowerCase() && x.e === e; }); },
    toggle: function (s, e) {
      var l = leggi(CH.serie, []), i = -1;
      l.forEach(function (x, n) { if (x.s.toLowerCase() === s.toLowerCase() && x.e === e) i = n; });
      if (i >= 0) { l.splice(i, 1); scrivi(CH.serie, l); return false; }
      l.push({ s: testo(s), e: testo(e) }); scrivi(CH.serie, l); return true;
    },
    togli: function (s, e) { scrivi(CH.serie, leggi(CH.serie, []).filter(function (x) { return !(x.s.toLowerCase() === s.toLowerCase() && x.e === e); })); }
  };

  var iscrizioni = {
    tutti: function () { return leggi(CH.iscr, []); },
    ha: function (k) { return leggi(CH.iscr, []).indexOf(k) >= 0; },
    toggle: function (k) {
      var l = leggi(CH.iscr, []), i = l.indexOf(k);
      if (i >= 0) { l.splice(i, 1); scrivi(CH.iscr, l); return false; }
      l.push(testo(k)); scrivi(CH.iscr, l); return true;
    }
  };

  // foto: immagine già ridotta (data URL), tenuta sotto i 300 mila caratteri
  var profilo = {
    leggi: function () { var p = leggi(CH.prof, {}); return { nome: p.nome || '', tel: p.tel || '', email: p.email || '', foto: p.foto || '' }; },
    salva: function (d) {
      var p = leggi(CH.prof, {}), n = { nome: p.nome || '', tel: p.tel || '', email: p.email || '', foto: p.foto || '' };
      ['nome', 'tel', 'email'].forEach(function (k) { if (d[k] !== undefined) n[k] = testo(d[k]); });
      if (d.foto !== undefined) n.foto = /^data:image\/(jpeg|png|webp);base64,/.test(d.foto) && d.foto.length < 300000 ? d.foto : '';
      scrivi(CH.prof, n);
    }
  };

  function azzera() { Object.keys(CH).forEach(function (n) { try { localStorage.removeItem(CH[n]); } catch (e) {} delete memoria[CH[n]]; }); cambiato(); }

  /* ---------- Testata: contatori di carrello e preferiti ---------- */
  function testata() {
    var n = carrello.conta(), p = pref.tutti().length;
    document.querySelectorAll('.js-carrello-n').forEach(function (s) { s.textContent = n; });
    document.querySelectorAll('a[href="carrello.html"]').forEach(function (a) { a.setAttribute('aria-label', 'Carrello, ' + n + (n === 1 ? ' prodotto' : ' prodotti')); });
    // l'icona dell'account mostra la foto del profilo, se c'è
    var foto = profilo.leggi().foto;
    document.querySelectorAll('a[href="profilo.html"][aria-label="Il tuo profilo"]').forEach(function (a) {
      var svg = a.querySelector('svg');
      a.style.backgroundImage = foto ? 'url("' + foto + '")' : ''; a.style.backgroundSize = 'cover'; a.style.backgroundPosition = 'center';
      if (svg) svg.style.display = foto ? 'none' : '';
    });
    document.querySelectorAll('.js-pref-n').forEach(function (s) { s.textContent = p; s.hidden = !p; });
    document.querySelectorAll('a[href$="#preferiti"][aria-label]').forEach(function (a) { a.setAttribute('aria-label', 'Preferiti' + (p ? ', ' + p : '')); });
  }
  function cambiato() { testata(); ascoltatori.forEach(function (f) { try { f(); } catch (e) {} }); }
  document.addEventListener('DOMContentLoaded', testata);
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('area51-') === 0) cambiato(); });

  /* ---------- Dal catalogo ---------- */
  function daRiga(r) {
    return { k: r[0], t: r[1], p: r[7], l: 'prodotto.html?cat=catalogo&ean=' + r[0], i: r[10] ? 'img/copertine/' + r[0] + '.webp' : '', e: EDITORI[r[4]] || r[4] };
  }

  window.A51 = {
    pref: pref, carrello: carrello, serie: serie, iscrizioni: iscrizioni, profilo: profilo, azzera: azzera,
    euro: euro, daRiga: daRiga, EDITORI: EDITORI, onChange: function (f) { ascoltatori.push(f); }
  };
})();

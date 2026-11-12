/* Modulo di prenotazione delle prossime uscite (usato da uscite.html e da catalogo.html).
   A51Prenota.apri(uscita) apre il modulo per un titolo; la richiesta viene salvata nella tabella "richieste"
   (tipo "prenotazione", collegata al titolo) e il gestore la legge nella sua area.
   uscita: { id, titolo, data_limite (ISO, facoltativa), scaduta (true se il termine per ordinare è passato) }.
   Se il termine è passato, il cliente vede l'avviso e deve confermare di averlo capito. */
(function () {
  var modulo = null, corrente = null;
  function el(tag, cls, testo) { var x = document.createElement(tag); if (cls) x.className = cls; if (testo != null) x.textContent = testo; return x; }
  function campo(id, etichetta, tipo, max, ph) {
    var d = el('div'), l = el('label', 'block font-heavy text-xs uppercase tracking-widest text-brand-lime mb-2', etichetta); l.htmlFor = id;
    var i = el('input', 'campo-profilo'); i.id = id; i.type = tipo; i.maxLength = max; i.placeholder = ph; d.appendChild(l); d.appendChild(i); return d;
  }
  function $(id) { return document.getElementById(id); }
  function chiudi() { if (modulo) modulo.hidden = true; }
  function dataIt(iso) { var d = new Date(iso + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function costruisci() {
    modulo = el('div', 'fixed inset-0 z-[88] flex items-center justify-center p-4 bg-[#070514]/80 backdrop-blur-sm'); modulo.hidden = true;
    var box = el('div', 'relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0d0724] border-2 border-brand-lime rounded-3xl shadow-[8px_8px_0_#5B21B6] p-6 sm:p-7');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'pren-titolo');
    var x = el('button', 'absolute top-3 right-3 w-11 h-11 rounded-full border border-white/15 hover:border-brand-lime hover:text-brand-lime text-xl leading-none', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Chiudi'); x.addEventListener('click', chiudi);
    var h = el('h2', 'font-heavy text-xl text-white pr-10', 'Prenota'); h.id = 'pren-titolo';
    var sott = el('p', 'text-sm font-semibold text-brand-muted mt-1'); sott.id = 'pren-nome';
    var scad = el('p', 'text-xs font-bold text-brand-lime mt-1 mb-4'); scad.id = 'pren-scad';
    var avviso = el('div', 'hidden rounded-xl border-2 border-[#FB923C] bg-[#FB923C]/10 p-3 mb-4 text-sm font-semibold text-white leading-snug'); avviso.id = 'pren-avviso';
    avviso.appendChild(el('b', 'block font-heavy text-[#FB923C] mb-1', 'Termine per ordinare scaduto'));
    avviso.appendChild(el('span', null, 'Il termine per ordinare questo titolo è passato: se lo prenoti, non è detto che arrivi. Ti diremo se riusciamo a procurartelo.'));
    var f = el('form', 'space-y-4'); f.noValidate = true;
    f.appendChild(campo('pren-nome-c', 'Il tuo nome', 'text', 40, 'Come ti chiami'));
    f.appendChild(campo('pren-email', 'La tua email', 'email', 80, 'nome@esempio.it'));
    f.appendChild(campo('pren-tel', 'Telefono (facoltativo)', 'tel', 20, 'Se preferisci una chiamata'));
    var dc = el('div'), lc = el('label', 'block font-heavy text-xs uppercase tracking-widest text-brand-lime mb-2', 'Quante copie'); lc.htmlFor = 'pren-copie';
    var sc = el('select', 'campo-profilo'); sc.id = 'pren-copie'; [1, 2, 3, 4, 5].forEach(function (n) { var o = el('option', null, String(n)); o.value = String(n); sc.appendChild(o); });
    dc.appendChild(lc); dc.appendChild(sc); f.appendChild(dc);
    var capito = el('label', 'hidden items-start gap-3 text-sm font-semibold text-white leading-snug cursor-pointer'); capito.id = 'pren-capito-l';
    var cc = el('input', 'mt-0.5 w-5 h-5 shrink-0 rounded border-white/30 bg-[#120a2e] text-brand-lime focus:ring-brand-lime'); cc.type = 'checkbox'; cc.id = 'pren-capito';
    capito.appendChild(cc); capito.appendChild(el('span', null, 'Ho capito che il titolo potrebbe non arrivare.')); f.appendChild(capito);
    var lab = el('label', 'flex items-start gap-3 text-sm font-semibold text-brand-muted leading-snug cursor-pointer');
    var cb = el('input', 'mt-0.5 w-5 h-5 shrink-0 rounded border-white/30 bg-[#120a2e] text-brand-lime focus:ring-brand-lime'); cb.type = 'checkbox'; cb.id = 'pren-privacy';
    var sp = el('span', null, 'Accetto che Area 51 usi questi dati solo per questa prenotazione. '), lk = el('a', 'text-white underline hover:text-brand-lime', 'Informativa sulla privacy'); lk.href = 'privacy.html'; lk.target = '_blank'; lk.rel = 'noopener'; sp.appendChild(lk);
    lab.appendChild(cb); lab.appendChild(sp); f.appendChild(lab);
    f.appendChild(el('p', 'text-xs font-semibold text-brand-muted leading-snug', 'Il negozio conferma la prenotazione. Regole di ritiro: [DA DEFINIRE]. Ritiro e pagamento in negozio.'));
    /* Pagamento della caparra online: NON ancora attivo (serve l'accordo con Nexi e la funzione sul server).
       Il pulsante spento si vede solo con ?anteprima-pagamenti=1 nell'indirizzo, oppure se la pagina imposta
       window.A51_PAGAMENTI = { mostra: true }. Quando i pagamenti saranno collegati, qui andrà il pulsante vero. */
    if ((window.A51_PAGAMENTI && window.A51_PAGAMENTI.mostra) || /[?&]anteprima-pagamenti=1/.test(location.search)) {
      var cap = el('div', 'rounded-xl border border-white/15 bg-[#120a2e] p-3');
      cap.appendChild(el('p', 'text-xs font-bold text-brand-muted uppercase tracking-wider mb-1', 'Caparra'));
      cap.appendChild(el('p', 'text-sm font-semibold text-brand-muted leading-snug', 'Per alcuni titoli il negozio può chiedere una caparra: [DA DEFINIRE]. Il pagamento online non è ancora attivo: il negozio ti dirà come pagarla.'));
      var pg = el('button', 'mt-2 w-full border-2 border-white/20 text-white/50 font-heavy text-sm px-5 py-3 rounded-full rounded-bl-[4px] cursor-not-allowed', 'Paga la caparra online · non ancora attivo');
      pg.type = 'button'; pg.disabled = true; pg.setAttribute('aria-disabled', 'true');
      cap.appendChild(pg); f.appendChild(cap);
    }
    var riga = el('div', 'flex flex-wrap items-center gap-3');
    var inv = el('button', 'bg-brand-violet hover:bg-brand-violetGlow text-white font-heavy text-sm px-6 py-3 rounded-full rounded-bl-[4px] shadow-[4px_4px_0_#B9E62E] transition-colors', 'Invia la prenotazione'); inv.type = 'submit';
    var es = el('p', 'text-sm font-bold text-brand-lime'); es.id = 'pren-esito'; es.setAttribute('role', 'status');
    riga.appendChild(inv); riga.appendChild(es); f.appendChild(riga);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = $('pren-nome-c').value.trim(), email = $('pren-email').value.trim(), tel = $('pren-tel').value.trim(), copie = parseInt($('pren-copie').value, 10) || 1;
      function err(m) { es.className = 'text-sm font-bold text-[#FB923C]'; es.textContent = m; }
      if (!nome) return err('Scrivi il tuo nome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Scrivi un’email valida: è lì che ti rispondiamo.');
      if (tel && !/^\+?[\d\s().-]{6,20}$/.test(tel)) return err('Il telefono non sembra corretto: controllalo o lascialo vuoto.');
      if (corrente.scaduta && !cc.checked) return err('Conferma di aver capito che il titolo potrebbe non arrivare.');
      if (!cb.checked) return err('Serve il consenso per inviare la prenotazione.');
      es.className = 'text-sm font-bold text-brand-lime'; es.textContent = 'Invio…'; inv.disabled = true;
      var cosa = corrente.titolo + (corrente.scaduta ? ' (termine scaduto)' : '') + ' · ' + copie + (copie === 1 ? ' copia' : ' copie');
      fetch(A51DB.url + '/rest/v1/richieste', {
        method: 'POST',
        headers: { apikey: A51DB.chiave, Authorization: 'Bearer ' + A51DB.chiave, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ tipo: 'prenotazione', cosa: cosa.slice(0, 300), categoria: 'Manga e fumetti', nome: nome, email: email, telefono: tel || null, uscita_id: corrente.id || null, copie: copie })
      }).then(function (r) {
        if (!r.ok) throw 0;
        f.reset(); es.className = 'text-sm font-bold text-brand-lime'; es.textContent = 'Ricevuto! Ti rispondiamo per email per confermare la prenotazione.';
        setTimeout(chiudi, 2600);
      }).catch(function () { err('Non sono riuscito a inviare. Riprova o chiama lo 0883 884567.'); })
        .then(function () { inv.disabled = false; });
    });
    box.appendChild(x); box.appendChild(h); box.appendChild(sott); box.appendChild(scad); box.appendChild(avviso); box.appendChild(f); modulo.appendChild(box);
    modulo.addEventListener('click', function (e) { if (e.target === modulo) chiudi(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudi(); });
    document.body.appendChild(modulo);
  }
  window.A51Prenota = {
    apri: function (u) {
      if (!modulo) costruisci();
      corrente = u;
      $('pren-nome').textContent = u.titolo;
      $('pren-scad').textContent = !u.scaduta && u.data_limite ? 'Prenota entro il ' + dataIt(u.data_limite) : '';
      $('pren-avviso').className = u.scaduta ? 'rounded-xl border-2 border-[#FB923C] bg-[#FB923C]/10 p-3 mb-4 text-sm font-semibold text-white leading-snug' : 'hidden';
      $('pren-capito-l').className = u.scaduta ? 'flex items-start gap-3 text-sm font-semibold text-white leading-snug cursor-pointer' : 'hidden';
      $('pren-capito').checked = false; $('pren-esito').textContent = ''; modulo.hidden = false; $('pren-nome-c').focus();
    }
  };
})();

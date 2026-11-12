/* Collegamento al database del negozio (Supabase, progetto "Area51").
   L'indirizzo e la chiave "anon" sono pubblici per progetto: chi li legge non può fare niente di più di quello
   che consentono le regole di sicurezza del database (RLS). I visitatori possono solo inviare richieste e iscrizioni;
   tutto il resto lo legge e lo modifica soltanto il gestore dopo l'accesso. */
window.A51DB = {
  url: 'https://qkaqrswpylqkpflwvuhk.supabase.co',
  chiave: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYXFyc3dweWxxa3BmbHd2dWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NTcxOTUsImV4cCI6MjEwODEzMzE5NX0.ksBxcAGwYNTXIpAXeugpfKEk5QAgqipZRMemCV1Eeyw'
};

/* Livelli del Club (tabella "livelli": soglia in euro spesi e vantaggio); visibili a tutti. Risolve con un elenco, vuoto se non ce ne sono o se il database non risponde. */
window.A51DB.livelli = function () {
  if (!window.fetch) return Promise.resolve([]);
  return fetch(A51DB.url + '/rest/v1/livelli?select=nome,soglia,vantaggio&order=soglia.asc', { headers: { apikey: A51DB.chiave, Authorization: 'Bearer ' + A51DB.chiave } })
    .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
};

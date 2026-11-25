/* Trasferimento una tantum da Supabase al nuovo database D1 (fase 3).
   Si trasferisce SOLO ciò che è arrivato dall'API Starshop: le uscite (fonte "starshop") e gli articoli del magazzino.
   Le altre tabelle di Supabase (prodotti, documenti, opere…) non si portano: non si sa se il negozio ha ancora quegli articoli.

   Ingresso: importazione/uscite.json e importazione/articoli.json (esportati da Supabase; cartella esclusa da git).
   Uscita:
   - database D1 LOCALE (.wrangler) riempito, e copertine caricate nell'R2 LOCALE con chiave "copertine/<file>";
   - importazione/dati.sql: le stesse righe in SQL, da applicare al database vero con
       npx wrangler d1 execute area51 --remote --file importazione/dati.sql
   - le copertine scaricate restano in importazione/copertine/ (per caricarle poi nell'R2 vero).
   Si può rilanciare: le righe si sostituiscono (stesso id), le copertine già scaricate non si riscaricano. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';

const QUI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CART = path.join(QUI, 'importazione');
const COP = path.join(CART, 'copertine');
const SUPABASE_COPERTINE = 'https://qkaqrswpylqkpflwvuhk.supabase.co/storage/v1/object/public/copertine-articoli/';

const leggi = (f) => JSON.parse(fs.readFileSync(path.join(CART, f), 'utf8'));
const uscite = leggi('uscite.json');
const articoli = leggi('articoli.json');
const chiave = (file) => (file ? 'copertine/' + file : file);   // '' resta '' (nessuna copertina), null resta null

/* ---------- righe ---------- */
const righeUscite = uscite.map((u) => ({
  id: u.id, riferimento_esterno: u.r, ean: u.ean, titolo: u.t, serie: u.s, numero: u.n, editore: u.e,
  prezzo: u.p == null ? null : Number(u.p), data_uscita: u.du, data_limite: u.dl, copertina: chiave(u.c),
  categoria: u.cat, fonte: 'starshop', visibile: u.v ? 1 : 0,
  creato_il: new Date(u.ci).toISOString().slice(0, 19) + 'Z', aggiornato_il: new Date(u.ai).toISOString().slice(0, 19) + 'Z',
}));
const righeArticoli = articoli.map((a) => ({
  id: a.id, codice_starshop: a.codice_starshop, ean: a.ean, ean_alt: JSON.stringify(a.ean_alt ?? []), titolo: a.titolo, autore: a.autore,
  editore: a.editore, codice_editore: a.codice_editore, codice_padre: a.codice_padre, numero: a.numero,
  prezzo_listino: a.prezzo_listino == null ? null : Number(a.prezzo_listino), lingua: a.lingua, pagine: a.pagine, data_uscita: a.data_uscita,
  categoria: a.categoria, sotto_categoria: a.sotto_categoria, copertina: chiave(a.copertina), stato: a.stato, data_arrivo: a.data_arrivo,
  esaurito_fornitore: a.esaurito_fornitore == null ? null : (a.esaurito_fornitore ? 1 : 0), visibile: a.visibile ? 1 : 0, fonte: a.fonte,
  creato_il: new Date(a.creato_il).toISOString().slice(0, 19) + 'Z', aggiornato_il: new Date(a.aggiornato_il).toISOString().slice(0, 19) + 'Z',
}));

const val = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'");
const insert = (tab, r) => 'INSERT OR REPLACE INTO ' + tab + ' (' + Object.keys(r).join(', ') + ') VALUES (' + Object.values(r).map(val).join(', ') + ');';
const sqlRighe = [...righeUscite.map((r) => insert('uscite', r)), ...righeArticoli.map((r) => insert('articoli', r))];
fs.writeFileSync(path.join(CART, 'dati.sql'), sqlRighe.join('\n') + '\n');
console.log('dati.sql pronto: ' + righeUscite.length + ' uscite, ' + righeArticoli.length + ' articoli');

/* ---------- D1 e R2 locali ---------- */
const { env, dispose } = await getPlatformProxy({ configPath: path.join(QUI, 'wrangler.jsonc') });
try {
  for (let i = 0; i < sqlRighe.length; i += 50) await env.DB.batch(sqlRighe.slice(i, i + 50).map((s) => env.DB.prepare(s)));
  console.log('D1 locale: righe scritte');

  fs.mkdirSync(COP, { recursive: true });
  const file = [...new Set([...uscite.map((u) => u.c), ...articoli.map((a) => a.copertina)].filter(Boolean))];
  let scaricate = 0, gia = 0, caricate = 0, mancanti = [];
  const coda = [...file];
  async function lavora() {
    while (coda.length) {
      const f = coda.shift(), locale = path.join(COP, f);
      if (!fs.existsSync(locale)) {
        const r = await fetch(SUPABASE_COPERTINE + encodeURIComponent(f));
        if (!r.ok) { mancanti.push(f + ' (' + r.status + ')'); continue; }
        fs.writeFileSync(locale, Buffer.from(await r.arrayBuffer()));
        scaricate++;
      } else gia++;
      await env.FILE.put('copertine/' + f, fs.readFileSync(locale), { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=604800' } });
      caricate++;
    }
  }
  await Promise.all([lavora(), lavora(), lavora(), lavora()]);
  console.log('copertine: ' + file.length + ' in elenco, ' + scaricate + ' scaricate, ' + gia + ' già presenti, ' + caricate + ' caricate in R2 locale');
  if (mancanti.length) console.log('non trovate su Supabase: ' + mancanti.join(', '));
} finally {
  await dispose();
}

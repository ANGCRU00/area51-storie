/* PROVVISORIO (fino alla fase 3/4, quando i dati arrivano da D1).
   Legge catalogo ed eventi del sito attuale (../sito/dati/*.js) e prepara ciò che serve alla home:
   src/data/provvisori.json + le copertine usate in public/img/copertine (cartella esclusa da git). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const QUI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITO = path.resolve(QUI, '../sito');
function carica(file, nome) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(SITO, file), 'utf8'), ctx);
  return ctx.window[nome] || [];
}
const D = carica('dati/catalogo.js', 'CATALOGO_DATI');
const E = carica('dati/eventi.js', 'EVENTI_DATI');

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const EDITORI = { star: 'Star Comics', jpop: 'J-POP', panini: 'Panini Comics' };
const GIORNO = 864e5, ora = Date.now();
const quando = (r) => new Date(r[8] + 'T00:00:00').getTime();
const dataTesto = (r) => { const d = new Date(quando(r)); return (r[9] ? d.getDate() + ' ' : '') + MESI[d.getMonth()] + ' ' + d.getFullYear(); };
const distinte = (l) => { const v = {}; return l.filter((r) => { const k = r[2].toLowerCase() + '|' + r[4]; if (v[k]) return false; v[k] = 1; return true; }); };
const base = D.filter((r) => r[10] === 1 && r[8]);
let nuovi = [];
for (const g of [60, 120, 365]) {
  nuovi = distinte(base.filter((r) => { const q = quando(r); return q <= ora && ora - q <= g * GIORNO; }).sort((a, b) => quando(b) - quando(a) || a[0].localeCompare(b[0])));
  if (nuovi.length >= 8) break;
}
nuovi = nuovi.slice(0, 8);
const prossime = distinte(base.filter((r) => quando(r) > ora).sort((a, b) => quando(a) - quando(b) || a[0].localeCompare(b[0]))).slice(0, 8);
const scheda = (r, pre) => ({ ean: r[0], titolo: r[1], editore: EDITORI[r[4]] || r[4], prezzo: r[7], quando: (pre ? 'Esce ' : 'Uscito ') + (r[9] ? 'il ' : 'a ') + dataTesto(r), pre });
const ultimo = base.filter((r) => quando(r) <= ora).sort((a, b) => quando(b) - quando(a))[0];

const NM = { Gen: 0, Feb: 1, Mar: 2, Apr: 3, Mag: 4, Giu: 5, Lug: 6, Ago: 7, Set: 8, Ott: 9, Nov: 10, Dic: 11 };
const GIOCO = { magic: 'Magic', pokemon: 'Pokémon', riftbound: 'Riftbound' }, FAMIGLIA = { serate: 'Giochi da tavolo', ruolo: 'Gioco di ruolo' };
const oggi0 = new Date(); oggi0.setHours(0, 0, 0, 0);
const anno = oggi0.getFullYear();
const ev = E.map((r) => ({ r, d: new Date(anno, NM[r[6]], r[5]).getTime() })).sort((a, b) => a.d - b.d || a.r[7].localeCompare(b.r[7]));
const pross = ev.filter((x) => x.d >= oggi0.getTime());
const eventi = (pross.length ? pross : ev).slice(0, 3).map(({ r }) => ({
  linea: r[0], tipo: GIOCO[r[1]] || FAMIGLIA[r[0]] || r[0], titolo: r[3], giorno: r[4], numero: r[5], mese: r[6], ora: r[7],
  quota: r[8] || 0, occupati: r[9] ?? null, posti: r[10] || 0,
}));

fs.mkdirSync(path.join(QUI, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(QUI, 'src/data/provvisori.json'), JSON.stringify({
  nota: 'File generato da scripts/dati-provvisori.mjs: non modificarlo a mano.',
  nuovi: nuovi.map((r) => scheda(r, false)),
  prossime: prossime.map((r) => scheda(r, true)),
  ultimo: ultimo ? { ean: ultimo[0], titolo: ultimo[1] } : null,
  eventi,
}, null, 1));

const DEST = path.join(QUI, 'public/img/copertine');
fs.mkdirSync(DEST, { recursive: true });
[...nuovi, ...prossime].forEach((r) => {
  const da = path.join(SITO, 'img/copertine', r[0] + '.webp');
  if (fs.existsSync(da)) fs.copyFileSync(da, path.join(DEST, r[0] + '.webp'));
});
console.log('dati provvisori: ' + nuovi.length + ' novità, ' + prossime.length + ' prossime uscite, ' + eventi.length + ' eventi');

/* PROVVISORIO (fino alla fase 8, quando gli eventi arrivano da D1).
   Legge gli eventi del sito attuale (../sito/dati/eventi.js) e prepara src/data/provvisori.json per la home. */
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
const E = carica('dati/eventi.js', 'EVENTI_DATI');

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
  eventi,
}, null, 1));
console.log('dati provvisori: ' + eventi.length + ' eventi');

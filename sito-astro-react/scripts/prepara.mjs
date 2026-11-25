/* Prepara la demo prima di "astro dev" / "astro build":
   1. legge i dati del sito attuale (catalogo, eventi) e calcola cosa mostra la home (src/data/home.json);
   2. copia in public/ gli unici file che servono (CSS già compilato, carattere, foto, copertine usate, script del sito);
   3. ricava dalla home attuale (../sito/index.html) le parti fisse, come componenti Astro (src/components/statici). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const QUI = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SITO = path.resolve(QUI, '../sito');
const PUB = path.join(QUI, 'public');

function carica(file, nome) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(SITO, file), 'utf8'), ctx);
  return ctx.window[nome] || [];
}
const D = carica('dati/catalogo.js', 'CATALOGO_DATI');
const E = carica('dati/eventi.js', 'EVENTI_DATI');

/* ---------- 1. dati della home, calcolati al momento della costruzione ---------- */
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

const NM = { Gen: 0, Feb: 1, Mar: 2, Apr: 3, Mag: 4, Giu: 5, Lug: 6, Ago: 7, Set: 8, Ott: 9, Nov: 10, Dic: 11 };
const oggi0 = new Date(); oggi0.setHours(0, 0, 0, 0);
const ev = E.map((r) => ({ r, d: new Date(2026, NM[r[6]], r[5]).getTime() })).sort((a, b) => a.d - b.d || a.r[7].localeCompare(b.r[7]));
const pross = ev.filter((x) => x.d >= oggi0.getTime());
const eventi = (pross.length ? pross : ev).slice(0, 3).map(({ r }) => ({
  linea: r[0], gioco: r[1], titolo: r[3], giorno: r[4], numero: r[5], mese: r[6], ora: r[7], quota: r[8], occupati: r[9], posti: r[10],
}));

fs.writeFileSync(path.join(QUI, 'src/data/home.json'), JSON.stringify({
  costruita: new Date().toISOString(),
  nuovi: nuovi.map((r) => scheda(r, false)),
  prossime: prossime.map((r) => scheda(r, true)),
  eventi,
}, null, 1));

/* ---------- 2. file pubblici ---------- */
function copia(rel) {
  const da = path.join(SITO, rel), a = path.join(PUB, rel);
  if (!fs.existsSync(da)) return;
  fs.mkdirSync(path.dirname(a), { recursive: true });
  fs.copyFileSync(da, a);
}
['css/style.css', 'fonts/archivo.woff2', 'img/angolo-manga.jpg', 'dati/catalogo.js', 'dati/eventi.js', 'dati/trame.js',
  'js/area51.js', 'js/area51-db.js', 'js/eventi-db.js', 'js/prenota.js', 'js/negozio-dati.js'].forEach(copia);
const ultimo = base.filter((r) => quando(r) <= ora).sort((a, b) => quando(b) - quando(a))[0];
[...nuovi, ...prossime, ultimo].filter(Boolean).forEach((r) => copia('img/copertine/' + r[0] + '.webp'));

/* ---------- 3. parti fisse della home attuale, come componenti Astro ---------- */
const righe = fs.readFileSync(path.join(SITO, 'index.html'), 'utf8').split(/\r?\n/);
const pezzo = (da, a) => righe.slice(da - 1, a).join('\n');
const scriptInline = (t) => t.replace(/<script(\s|>)/g, '<script is:inline$1');
function salva(nome, testo, intestazione = '') {
  if (/[{}]/.test(testo.replace(/<script[\s\S]*?<\/script>/g, ''))) throw new Error(nome + ': graffe fuori dagli script, da sistemare');
  fs.writeFileSync(path.join(QUI, 'src/components/statici', nome + '.astro'), (intestazione ? '---\n' + intestazione + '\n---\n' : '') + testo + '\n');
}
salva('Sfondo', pezzo(14, 203));

// Testata: il pulsante del carrello diventa un'isola React
let testata = pezzo(205, 288);
testata = testata.replace(/      <a class="whitespace-nowrap bg-brand-lime[^]*?<\/a>\n/, '      <div class="isola" data-nome="Isola: Carrello"><Carrello client:load /></div>\n');
salva('Testata', testata, "import Carrello from '../isole/Carrello.tsx';");

// Intestazione: la riga "Orari" diventa un'isola React (stato del negozio aggiornato in diretta)
let hero = pezzo(291, 336);
hero = hero.replace(/<li><a id="hi-orari"[^]*?<\/a><\/li>/, '<li class="isola" data-nome="Isola: Stato del negozio"><StatoNegozio client:load /></li>');
salva('Intestazione', hero, "import StatoNegozio from '../isole/StatoNegozio.tsx';");

salva('Nastro', pezzo(337, 344));
salva('Club', pezzo(368, 385));
salva('Piede', pezzo(400, 424));
salva('Modali', pezzo(818, 868));
salva('Script', scriptInline([
  '<script src="dati/catalogo.js"></script>', '<script src="dati/eventi.js"></script>', '<script src="js/area51-db.js"></script>',
  '<script src="js/eventi-db.js"></script>', '<script src="js/prenota.js"></script>',
  pezzo(431, 460), pezzo(592, 592), pezzo(593, 720), pezzo(721, 763), pezzo(764, 817)].join('\n')));
salva('ScriptFinali', scriptInline(pezzo(869, 982)));
console.log('preparata: ' + nuovi.length + ' novità, ' + prossime.length + ' prossime uscite, ' + eventi.length + ' eventi');

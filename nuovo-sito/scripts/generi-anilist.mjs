/* Propone genere e segnalazione 18+ delle serie MANGA cercandole su AniList (https://anilist.co, API pubblica e gratuita).
   Decisione di Angelo (25/11/2026): Starshop non ha questi dati, quindi si usa AniList e poi il gestore conferma o corregge.

   Cosa fa: per ogni serie manga presente tra uscite e magazzino (chiave = codice padre Starshop) cerca il nome su AniList,
   sceglie il risultato con il titolo più simile e, se abbastanza simile, salva nella tabella "serie" del D1 LOCALE:
   generi del sito (vedi GENERI in src/db/schema.ts), "adulti" (isAdult o genere Hentai di AniList), dati della proposta.
   Le serie già confermate dal gestore non si toccano. Prepara anche importazione/serie.sql per il database vero.
   A AniList si inviano solo i nomi delle serie (dati pubblici). Pausa di 2,2 s tra le richieste (limite del servizio).
   Uso: node scripts/generi-anilist.mjs [--tutte]   (senza --tutte salta le serie già cercate) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';

const QUI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tutte = process.argv.includes('--tutte');
const MINIMO = 0.72;   // somiglianza minima tra i titoli per accettare la proposta

// generi AniList → generi del sito; i tag "demografici" → shonen/shojo/seinen/josei
const DA_GENERE = { Action: 'azione', Adventure: 'avventura', Comedy: 'commedia', Fantasy: 'fantasy', 'Sci-Fi': 'fantascienza', Horror: 'horror',
  Mystery: 'giallo', Sports: 'sportivo', 'Slice of Life': 'slice', Romance: 'romance' };
const DA_TAG = { Shounen: 'shonen', Shoujo: 'shojo', Seinen: 'seinen', Josei: 'josei' };

/* stesso criterio del sito (src/lib/prodotti.ts, serieVolume): titolo senza il numero finale */
function nomeSerie(titolo) {
  const m = titolo.match(/^(.*?)(?:\s+(?:N\.?|NO\.?|VOL\.?|#)\s*|\s+|\s*[.#-]\s*)(\d{1,4})\s*$/i);
  return (m && m[1].trim().length >= 2 ? m[1].trim() : titolo.trim())
    .replace(/\s+\b(VARIANT|VRT|VAR|DELUXE|LIMITED|LTD|ED\.?\s*[A-Z]+)\b.*$/i, '').trim();
}
const pulisci = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function somiglianza(a, b) {
  a = pulisci(a); b = pulisci(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const coppie = (s) => { const x = s.replace(/ /g, ''); const o = new Map(); for (let i = 0; i < x.length - 1; i++) { const k = x.slice(i, i + 2); o.set(k, (o.get(k) ?? 0) + 1); } return o; };
  const A = coppie(a), B = coppie(b);
  let comuni = 0, tot = 0;
  for (const [k, n] of A) { comuni += Math.min(n, B.get(k) ?? 0); tot += n; }
  for (const n of B.values()) tot += n;
  return tot ? (2 * comuni) / tot : 0;
}

const QUERY = `query ($s: String) { Page(perPage: 6) { media(search: $s, type: MANGA) {
  id isAdult genres countryOfOrigin title { romaji english native } synonyms tags { name rank category } } } }`;
let ultima = 0;
async function cercaAnilist(nome) {
  for (let tentativo = 0; tentativo < 4; tentativo++) {
    const attesa = 2200 - (Date.now() - ultima); if (attesa > 0) await new Promise((r) => setTimeout(r, attesa));
    ultima = Date.now();
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { s: nome } }), signal: AbortSignal.timeout(20000),
    });
    if (r.status === 429) { const dopo = Number(r.headers.get('retry-after')) || 60; console.log('  AniList chiede una pausa di ' + dopo + ' s'); await new Promise((x) => setTimeout(x, dopo * 1000)); continue; }
    if (!r.ok) throw new Error('AniList HTTP ' + r.status);
    const j = await r.json();
    return j?.data?.Page?.media ?? [];
  }
  throw new Error('AniList non risponde');
}

const { env, dispose } = await getPlatformProxy({ configPath: path.join(QUI, 'wrangler.jsonc') });
try {
  const righe = (await env.DB.prepare(`
    SELECT codice_padre AS chiave, titolo FROM uscite WHERE categoria = 'manga' AND codice_padre IS NOT NULL
    UNION ALL SELECT codice_padre, titolo FROM articoli WHERE sotto_categoria = 'FUMETTO MANGA' AND codice_padre IS NOT NULL`).all()).results;
  const perChiave = new Map();
  for (const r of righe) if (!perChiave.has(r.chiave)) perChiave.set(r.chiave, nomeSerie(r.titolo));
  const gia = new Map((await env.DB.prepare('SELECT chiave, confermata, fonte FROM serie').all()).results.map((r) => [r.chiave, r]));
  const daFare = [...perChiave].filter(([k]) => !gia.get(k)?.confermata && (tutte || !gia.has(k)));
  console.log(perChiave.size + ' serie manga, da cercare ora: ' + daFare.length + ' (circa ' + Math.ceil(daFare.length * 2.3 / 60) + ' minuti)');

  let trovate = 0, adulti = 0, n = 0;
  for (const [chiave, nome] of daFare) {
    n++;
    let migliore = null;
    try {
      for (const m of await cercaAnilist(nome)) {
        // titoli principali a pieno valore; nomi alternativi (synonyms) valgono meno e, per i nomi corti
        // (es. "SENSE", "MARIA", "ON & OFF"), non bastano: troppe coincidenze con manga diversi
        const principali = [m.title?.romaji, m.title?.english].filter(Boolean);
        const corto = pulisci(nome).replace(/ /g, '').length < 9;
        const sP = Math.max(0, ...principali.map((t) => somiglianza(nome, t)));
        const sA = corto ? 0 : Math.max(0, ...(m.synonyms ?? []).map((t) => somiglianza(nome, t))) * 0.92;
        let s = Math.max(sP, sA);
        // per segnare una serie come "per adulti" serve un titolo principale praticamente uguale
        if ((m.isAdult || (m.genres ?? []).includes('Hentai')) && sP < 0.95) s = Math.min(s, MINIMO - 0.01);
        if (!migliore || s > migliore.s) migliore = { m, s };
      }
    } catch (e) { console.log('  ' + nome + ': errore ' + e.message); continue; }
    const ok = migliore && migliore.s >= MINIMO;
    const m = ok ? migliore.m : null;
    const generi = m ? [...new Set([
      ...(m.tags ?? []).filter((t) => t.category === 'Demographic' && DA_TAG[t.name]).map((t) => DA_TAG[t.name]),
      ...(m.genres ?? []).map((g) => DA_GENERE[g]).filter(Boolean),
    ])] : [];
    const adulto = !!m && (m.isAdult || (m.genres ?? []).includes('Hentai'));
    if (ok) trovate++; if (adulto) adulti++;
    await env.DB.prepare(`INSERT INTO serie (chiave, nome, generi, adulti, fonte, anilist_id, anilist_titolo, anilist_generi, somiglianza, confermata, aggiornata_il)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      ON CONFLICT(chiave) DO UPDATE SET nome = excluded.nome, generi = excluded.generi, adulti = excluded.adulti, fonte = excluded.fonte,
        anilist_id = excluded.anilist_id, anilist_titolo = excluded.anilist_titolo, anilist_generi = excluded.anilist_generi,
        somiglianza = excluded.somiglianza, aggiornata_il = excluded.aggiornata_il WHERE serie.confermata = 0`)
      .bind(chiave, nome, JSON.stringify(generi), adulto ? 1 : 0, ok ? 'anilist' : 'nessuna', m?.id ?? null,
        m ? (m.title?.english || m.title?.romaji) : (migliore ? '(scartato) ' + (migliore.m.title?.romaji ?? '') : null),
        m ? JSON.stringify(m.genres ?? []) : null, migliore ? Math.round(migliore.s * 100) / 100 : null).run();
    if (n % 20 === 0 || n === daFare.length) console.log('  ' + n + '/' + daFare.length + ' · trovate ' + trovate + ' · per adulti ' + adulti);
  }

  // copia per il database vero
  const tutteLeSerie = (await env.DB.prepare('SELECT * FROM serie').all()).results;
  const val = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'");
  fs.mkdirSync(path.join(QUI, 'importazione'), { recursive: true });
  fs.writeFileSync(path.join(QUI, 'importazione/serie.sql'), tutteLeSerie.map((r) =>
    'INSERT OR REPLACE INTO serie (' + Object.keys(r).join(', ') + ') VALUES (' + Object.values(r).map(val).join(', ') + ');').join('\n') + '\n');
  console.log('fatto: ' + trovate + ' trovate su ' + daFare.length + ', ' + adulti + ' per adulti. Copia in importazione/serie.sql');
} finally {
  await dispose();
}

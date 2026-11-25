/* Prodotti del sito, letti da D1: articoli del magazzino (scansionati dal gestore) e prossime uscite (Starshop o a mano).
   Decisione di Angelo (25/11/2026): il catalogo mostra SOLO magazzino + uscite, niente cataloghi editori né dati presunti.
   Qui ci sono le regole comuni a catalogo, uscite, scheda prodotto e home. */
import { and, asc, desc, eq, gte, inArray, like, lte, or, sql, type SQL } from 'drizzle-orm';
import { articoli, db, serie as tabellaSerie, uscite, GENERI, type Articolo, type Uscita } from '../db';

export { GENERI };
export const NOME_GENERE: Record<string, string> = {
  shonen: 'Shōnen', shojo: 'Shōjo', seinen: 'Seinen', josei: 'Josei', fantasy: 'Fantasy', fantascienza: 'Fantascienza', horror: 'Horror',
  giallo: 'Giallo', sportivo: 'Sportivo', commedia: 'Commedia', avventura: 'Avventura', slice: 'Slice of life', romance: 'Romance', azione: 'Azione',
};
/** cookie che il visitatore imposta confermando di essere maggiorenne (interruttore 18+) */
export const COOKIE_ADULTI = 'area51_adulti';

export const CATEGORIE = ['manga', 'fumetti', 'tcg', 'giochi', 'figure', 'gadget'] as const;
export type Categoria = (typeof CATEGORIE)[number];
export const NOME_CATEGORIA: Record<Categoria, string> = {
  manga: 'Manga', fumetti: 'Fumetti', tcg: 'TCG', giochi: 'Giochi da tavolo e di ruolo', figure: 'Figure e Funko', gadget: 'Gadget',
};

/** Stessa regola della sincronizzazione Starshop (privato/starshop-edge-function.ts, categoriaUscita) */
export function categoriaDaStarshop(categoria: string | null, sotto: string | null): Categoria | null {
  const c = (categoria ?? '').trim().toUpperCase(), s = (sotto ?? '').trim().toUpperCase();
  if (c === 'PUBBLICAZIONI') {
    if (s === 'FUMETTO MANGA') return 'manga';
    if (['FUMETTO U.S.A.', 'FUMETTO ITALIANO', 'FUMETTO FRANCO-BELGA', 'FUMETTO SPAGNOLO', 'ILLUSTRAZIONE'].includes(s) || s.startsWith('FUMETTO D')) return 'fumetti';
    return null;
  }
  if (s === 'GIOCHI DI CARTE' && (c === 'GIOCHI' || c === 'GADGET')) return 'tcg';
  if (c === 'GIOCHI' && (s === 'GIOCHI DA TAVOLO' || s === 'GIOCHI DI RUOLO')) return 'giochi';
  return null;
}

/** Stato mostrato al cliente */
export type Disponibilita = 'in_negozio' | 'appena_arrivato' | 'esaurito' | 'preordine' | 'uscito';
export const TESTO_DISPONIBILITA: Record<Disponibilita, string> = {
  in_negozio: 'Disponibile in negozio', appena_arrivato: 'Appena arrivato', esaurito: 'Esaurito, ordinabile',
  preordine: 'Prenotabile', uscito: 'Uscito: chiedi in negozio',
};

export type Prodotto = {
  /** codice nell'indirizzo /prodotto/<codice>: EAN se c'è, altrimenti codice Starshop */
  codice: string;
  tipo: 'magazzino' | 'uscita';
  idUscita?: string;
  ean: string | null;
  titolo: string;
  autore: string | null;
  editore: string | null;
  numero: string | null;
  prezzo: number | null;
  dataUscita: string | null;
  dataLimite: string | null;
  categoria: Categoria | null;
  copertina: string | null;
  disponibilita: Disponibilita;
  pagine: number | null;
  lingua: string | null;
  codicePadre: string | null;
  /** nome della serie (titolo senza il numero finale) e numero del volume, se si riconoscono */
  serie: string;
  volume: string | null;
  /** Standard, Variant, Deluxe, Limited… ricavata dal titolo (solo manga e fumetti) */
  edizione: string | null;
  /** dalla tabella serie (AniList + gestore): generi del sito e contenuti per adulti */
  generi: string[];
  adulti: boolean;
};

type InfoSerie = { generi: string[]; adulti: boolean };
/** genere ed età di tutte le serie (tabella piccola: si legge intera) */
async function mappaSerie(): Promise<Map<string, InfoSerie>> {
  const righe = await db().select({ chiave: tabellaSerie.chiave, generi: tabellaSerie.generi, adulti: tabellaSerie.adulti }).from(tabellaSerie);
  return new Map(righe.map((r) => [r.chiave, { generi: r.generi ?? [], adulti: r.adulti }]));
}
function conSerie(p: Prodotto, m: Map<string, InfoSerie>): Prodotto {
  const s = p.codicePadre ? m.get(p.codicePadre) : undefined;
  return s ? { ...p, generi: s.generi, adulti: s.adulti } : p;
}

/* Serie e volume: "BLUE BOX 17" con numero 17 → serie "BLUE BOX", volume "17" */
/* indicazioni di edizione in fondo al titolo (come le scrive Starshop): si tolgono prima di cercare il numero del volume */
const SEGNI_EDIZIONE = /\s+(NEW\.?\s?ED\.?|N\.\s?ED\.?|NUOVA\s+EDIZIONE|NEW\s+EDITION|ED\.?\s+DELUXE|DELUXE|VARIANT|VRT|LIMITED|LTD)\s*$/i;
function serieVolume(titolo: string, numero: string | null): { serie: string; volume: string | null } {
  let base = titolo.trim();
  for (let i = 0; i < 3 && SEGNI_EDIZIONE.test(base); i++) base = base.replace(SEGNI_EDIZIONE, '').replace(/\s*-\s*$/, '').trim();
  titolo = base;
  // il numero finale, preceduto da spazio o da "N.", "Vol.", "#" (ma non dalla N finale di una parola, es. EDITION)
  const m = titolo.match(/^(.*?)(?:\s+(?:N\.?|NO\.?|VOL\.?|#)\s*|\s+|\s*[.#-]\s*)(\d{1,4})\s*$/i);
  if (m && m[1].trim().length >= 2 && (!numero || Number(m[2]) === Number(numero))) return { serie: m[1].trim(), volume: String(Number(m[2])) };
  // il numero Starshop da solo non basta (per carte e giochi è un progressivo di catalogo): senza numero nel titolo, niente volume
  return { serie: titolo, volume: null };
}
/** Serie e volume solo per manga e fumetti; carte e giochi restano con il titolo intero */
const volumeSeLibro = (titolo: string, numero: string | null, c: Categoria | null) =>
  c === 'manga' || c === 'fumetti' ? serieVolume(titolo, numero) : { serie: titolo, volume: null };
function edizioneDa(titolo: string, categoria: Categoria | null): string | null {
  if (categoria !== 'manga' && categoria !== 'fumetti') return null;
  const t = titolo.toUpperCase();
  const nuova = /(\bNEW\.?\s?ED\b|\bN\.\s?ED\b|NUOVA\s+EDIZIONE|NEW\s+EDITION)/.test(t);
  if (/\b(VARIANT|VRT|VAR)\b/.test(t)) return nuova ? 'Nuova edizione, Variant' : 'Variant';
  if (nuova) return 'Nuova edizione';
  if (/\bDELUXE\b/.test(t)) return 'Deluxe';
  if (/\b(LIMITED|LTD|LIMITATA)\b/.test(t)) return 'Limited';
  if (/\b(COLLECTOR|SPECIAL|SPECIALE)\b/.test(t)) return 'Speciale';
  return 'Standard';
}

const oggi = () => new Date().toISOString().slice(0, 10);
/** "AA.VV." (autori vari) scritto per esteso */
const autoreLeggibile = (a: string | null) => (a && /^AA\.?\s?VV\.?$/i.test(a.trim()) ? 'Autori vari' : a);
export const urlCopertina = (chiave: string | null) => (chiave ? '/file/' + chiave : null);

export function daArticolo(a: Articolo): Prodotto {
  const disp: Disponibilita = a.stato === 'esaurito' ? 'esaurito' : a.stato === 'appena_arrivato' ? 'appena_arrivato'
    : a.stato === 'annunciato' ? 'preordine' : 'in_negozio';
  return {
    codice: a.ean || a.codiceStarshop, tipo: 'magazzino', ean: a.ean, titolo: a.titolo, autore: autoreLeggibile(a.autore), editore: a.editore,
    numero: a.numero == null ? null : String(a.numero), prezzo: a.prezzoListino, dataUscita: a.dataUscita, dataLimite: null,
    categoria: categoriaDaStarshop(a.categoria, a.sottoCategoria), copertina: urlCopertina(a.copertina), disponibilita: disp,
    pagine: a.pagine, lingua: a.lingua, codicePadre: a.codicePadre,
    ...volumeSeLibro(a.titolo, a.numero == null ? null : String(a.numero), categoriaDaStarshop(a.categoria, a.sottoCategoria)), edizione: edizioneDa(a.titolo, categoriaDaStarshop(a.categoria, a.sottoCategoria)), generi: [], adulti: false,
  };
}

export function daUscita(u: Uscita): Prodotto {
  return {
    codice: u.ean || u.riferimentoEsterno || u.id, tipo: 'uscita', idUscita: u.id, ean: u.ean, titolo: u.titolo, autore: autoreLeggibile(u.autore), editore: u.editore,
    numero: u.numero, prezzo: u.prezzo, dataUscita: u.dataUscita, dataLimite: u.dataLimite, categoria: u.categoria, copertina: urlCopertina(u.copertina),
    disponibilita: u.dataUscita && u.dataUscita <= oggi() ? 'uscito' : 'preordine', pagine: u.pagine, lingua: u.lingua,
    codicePadre: u.codicePadre ?? (u.riferimentoEsterno ? u.riferimentoEsterno.replace(/\d{4}$/, '') : null),
    ...volumeSeLibro(u.titolo, u.numero, u.categoria), edizione: edizioneDa(u.titolo, u.categoria), generi: [], adulti: false,
  };
}

/* ---------- formati ---------- */
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const euro = (x: number | null) => (x == null ? 'Prezzo da confermare' : x.toFixed(2).replace('.', ',') + ' €');
export const dataLunga = (iso: string) => { const d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear(); };
export const nomeMese = (aaaamm: string) => { const [a, m] = aaaamm.split('-'); return MESI[Number(m) - 1].replace(/^./, (c) => c.toUpperCase()) + ' ' + a; };
export function quando(p: Prodotto): string {
  if (!p.dataUscita) return '';
  return (p.dataUscita > oggi() ? 'Esce il ' : 'Uscito il ') + dataLunga(p.dataUscita);
}

/* ---------- ricerca nel catalogo ---------- */
export type Filtri = {
  categorie: Categoria[];
  cerca?: string;
  stato?: 'tutti' | 'negozio' | 'preordini';
  editori?: string[];
  generi?: string[];
  /** il visitatore ha confermato di essere maggiorenne: si mostrano anche i titoli per adulti */
  adulti?: boolean;
  mese?: string;           // AAAA-MM, solo per le uscite
  ordine?: 'recenti' | 'uscita' | 'prezzo' | 'titolo';
  pagina?: number;
  perPagina?: number;
};
export type Risultato = { prodotti: Prodotto[]; totale: number; pagine: number; pagina: number; editori: string[]; mesi: string[]; generi: string[]; nascostiAdulti: number };

/* Testo di ricerca: ogni parola deve comparire nel titolo, nell'editore o nell'autore (senza distinguere maiuscole). */
function condizioniCerca<T extends { titolo: any; editore: any }>(t: T, cerca: string, autore?: any): SQL | undefined {
  const parole = cerca.toLowerCase().split(/\s+/).filter((w) => w.length > 1).slice(0, 5);
  if (!parole.length) return undefined;
  return and(...parole.map((w) => {
    const v = '%' + w.replace(/[%_]/g, '') + '%';
    return autore ? or(like(sql`lower(${t.titolo})`, v), like(sql`lower(${t.editore})`, v), like(sql`lower(${autore})`, v))
      : or(like(sql`lower(${t.titolo})`, v), like(sql`lower(${t.editore})`, v));
  }));
}

/** Catalogo: articoli visibili del magazzino + uscite visibili, filtrati e ordinati. Le uscite già passate da più di 30 giorni non si mostrano. */
export async function cercaProdotti(f: Filtri): Promise<Risultato> {
  const d = db(), stato = f.stato ?? 'tutti', per = f.perPagina ?? 16;
  const limiteVecchie = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  // magazzino: si filtra la categoria dopo, perché si ricava da categoria + sottocategoria di Starshop
  let magazzino: Prodotto[] = [];
  if (stato !== 'preordini') {
    const cond = [eq(articoli.visibile, true)];
    if (f.cerca) { const c = condizioniCerca(articoli, f.cerca, articoli.autore); if (c) cond.push(c); }
    magazzino = (await d.select().from(articoli).where(and(...cond)).limit(2000)).map(daArticolo)
      .filter((p) => p.categoria && f.categorie.includes(p.categoria) && p.disponibilita !== 'preordine');
  }

  let prossime: Prodotto[] = [];
  if (stato !== 'negozio') {
    const cond = [eq(uscite.visibile, true), gte(uscite.dataUscita, limiteVecchie)];
    const catUscite = f.categorie.filter((c) => c === 'manga' || c === 'fumetti' || c === 'tcg' || c === 'giochi');
    if (!catUscite.length) cond.push(sql`0`);
    else cond.push(inArray(uscite.categoria, catUscite as ('manga' | 'fumetti' | 'tcg' | 'giochi')[]));
    if (f.cerca) { const c = condizioniCerca(uscite, f.cerca); if (c) cond.push(c); }
    if (f.mese && /^\d{4}-\d{2}$/.test(f.mese)) cond.push(like(uscite.dataUscita, f.mese + '%'));
    prossime = (await d.select().from(uscite).where(and(...cond)).orderBy(asc(uscite.dataUscita), asc(uscite.titolo)).limit(3000)).map(daUscita);
  }

  // stesso codice in magazzino e tra le uscite: vale il magazzino
  const inMagazzino = new Set(magazzino.map((p) => p.codice));
  const ms = await mappaSerie();
  let tutti = [...magazzino, ...prossime.filter((p) => !inMagazzino.has(p.codice))].map((p) => conSerie(p, ms));
  // titoli per adulti: fuori dagli elenchi finché il visitatore non li attiva
  const nascostiAdulti = f.adulti ? 0 : tutti.filter((p) => p.adulti).length;
  if (!f.adulti) tutti = tutti.filter((p) => !p.adulti);
  // generi presenti (per il menu) prima di filtrare per genere; poi almeno uno dei generi scelti
  const generiPresenti = GENERI.filter((g) => tutti.some((p) => p.generi.includes(g)));
  if (f.generi?.length) tutti = tutti.filter((p) => p.generi.some((g) => f.generi!.includes(g)));

  const ordine = f.ordine ?? 'recenti';
  const confronto: Record<string, (a: Prodotto, b: Prodotto) => number> = {
    // prima ciò che è in negozio (dal più recente), poi le uscite da prenotare (dalla più vicina), infine quelle appena uscite
    recenti: (a, b) => {
      const gruppo = (p: Prodotto) => (p.tipo === 'magazzino' ? 0 : p.disponibilita === 'preordine' ? 1 : 2);
      if (gruppo(a) !== gruppo(b)) return gruppo(a) - gruppo(b);
      const data = a.tipo === 'magazzino' ? (b.dataUscita ?? '').localeCompare(a.dataUscita ?? '') : (a.dataUscita ?? '9999').localeCompare(b.dataUscita ?? '9999');
      return data || a.titolo.localeCompare(b.titolo, 'it', { numeric: true });
    },
    uscita: (a, b) => (a.dataUscita ?? '9999').localeCompare(b.dataUscita ?? '9999') || a.titolo.localeCompare(b.titolo),
    prezzo: (a, b) => (a.prezzo ?? 1e9) - (b.prezzo ?? 1e9) || a.titolo.localeCompare(b.titolo),
    titolo: (a, b) => a.titolo.localeCompare(b.titolo, 'it', { numeric: true }),
  };
  tutti.sort(confronto[ordine] ?? confronto.recenti);

  // elenchi per i menu dei filtri. Gli editori si contano PRIMA di filtrare per editore, così scegliendone uno
  // gli altri restano nell'elenco e se ne possono aggiungere (scelta multipla vera).
  const editori = [...new Set(tutti.map((p) => p.editore).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
  if (f.editori?.length) tutti = tutti.filter((p) => p.editore && f.editori!.includes(p.editore));
  const mesi = [...new Set(tutti.filter((p) => p.tipo === 'uscita' && p.dataUscita).map((p) => p.dataUscita!.slice(0, 7)))].sort();

  const totale = tutti.length, pagine = Math.max(1, Math.ceil(totale / per)), pagina = Math.min(Math.max(1, f.pagina ?? 1), pagine);
  return { prodotti: tutti.slice((pagina - 1) * per, pagina * per), totale, pagine, pagina, editori, mesi, generi: generiPresenti, nascostiAdulti };
}

/** Scheda prodotto: cerca il codice (EAN o codice Starshop) prima nel magazzino visibile, poi tra le uscite visibili. */
export async function trovaProdotto(codice: string): Promise<{ prodotto: Prodotto; altri: Prodotto[]; edizioni: Prodotto[]; simili: Prodotto[] } | null> {
  if (!/^[A-Za-z0-9-]{4,40}$/.test(codice)) return null;
  const d = db();
  const [a] = await d.select().from(articoli).where(and(eq(articoli.visibile, true), or(eq(articoli.ean, codice), eq(articoli.codiceStarshop, codice)))).limit(1);
  let prodotto: Prodotto | null = a ? daArticolo(a) : null;
  if (!prodotto) {
    const [u] = await d.select().from(uscite).where(and(eq(uscite.visibile, true), or(eq(uscite.ean, codice), eq(uscite.riferimentoEsterno, codice), eq(uscite.id, codice)))).limit(1);
    if (u) prodotto = daUscita(u);
  }
  if (!prodotto) return null;
  const ms = await mappaSerie();
  prodotto = conSerie(prodotto, ms);

  // altri volumi della stessa serie: stesso codice padre Starshop (codice senza le ultime 4 cifre)
  const visti = new Set([prodotto.codice]);
  const nuovo = (x: Prodotto) => (visti.has(x.codice) ? false : (visti.add(x.codice), true));
  let stessaSerie: Prodotto[] = [];
  if (prodotto.codicePadre && prodotto.codicePadre.length >= 6) {
    const p = prodotto.codicePadre;
    const da = (await d.select().from(articoli).where(and(eq(articoli.visibile, true), eq(articoli.codicePadre, p))).limit(40)).map(daArticolo);
    const du = (await d.select().from(uscite).where(and(eq(uscite.visibile, true), eq(uscite.codicePadre, p))).limit(40)).map(daUscita);
    stessaSerie = [...da, ...du].filter(nuovo);
  }
  // altre edizioni dello stesso volume (es. Variant): stessa serie e stesso numero, anche con codice diverso
  if (prodotto.volume && prodotto.serie.length >= 3) {
    const prefisso = prodotto.serie.replace(/[%_]/g, '') + '%';
    const du = (await d.select().from(uscite).where(and(eq(uscite.visibile, true), like(uscite.titolo, prefisso))).limit(40)).map(daUscita);
    stessaSerie.push(...du.filter((x) => x.serie === prodotto!.serie).filter(nuovo));
  }
  const edizioni = stessaSerie.filter((x) => x.volume && x.volume === prodotto!.volume);
  const altri = stessaSerie.filter((x) => !edizioni.includes(x))
    .sort((x, y) => Number(x.volume ?? 0) - Number(y.volume ?? 0) || (x.dataUscita ?? '').localeCompare(y.dataUscita ?? '')).slice(0, 12);

  // ti potrebbe piacere: stesso editore, altre serie, con copertina, prossime uscite
  let simili: Prodotto[] = [];
  if (prodotto.editore) {
    const cond = [eq(uscite.visibile, true), eq(uscite.editore, prodotto.editore), sql`${uscite.copertina} <> ''`, gte(uscite.dataUscita, oggi())];
    if (prodotto.codicePadre) cond.push(sql`coalesce(${uscite.codicePadre}, '') <> ${prodotto.codicePadre}`);
    simili = (await d.select().from(uscite).where(and(...cond)).orderBy(asc(uscite.dataUscita)).limit(12)).map(daUscita)
      .filter((x) => x.serie !== prodotto!.serie).filter(nuovo).slice(0, 4);
  }
  return { prodotto, altri: altri.map((x) => conSerie(x, ms)), edizioni: edizioni.map((x) => conSerie(x, ms)), simili: simili.map((x) => conSerie(x, ms)).filter((x) => !x.adulti || prodotto!.adulti) };
}

/** Home: ultime uscite (già uscite di recente o articoli arrivati) e prossime uscite */
export async function perLaHome(): Promise<{ appena: Prodotto[]; prossime: Prodotto[] }> {
  const d = db(), o = oggi(), mese = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const arrivati = (await d.select().from(articoli).where(and(eq(articoli.visibile, true), inArray(articoli.stato, ['appena_arrivato', 'disponibile'])))
    .orderBy(desc(articoli.dataArrivo), desc(articoli.aggiornatoIl)).limit(8)).map(daArticolo);
  const usciti = (await d.select().from(uscite).where(and(eq(uscite.visibile, true), lte(uscite.dataUscita, o), gte(uscite.dataUscita, mese), sql`${uscite.copertina} <> ''`))
    .orderBy(desc(uscite.dataUscita), asc(uscite.titolo)).limit(8)).map(daUscita);
  const prossime = (await d.select().from(uscite).where(and(eq(uscite.visibile, true), sql`${uscite.dataUscita} > ${o}`, sql`${uscite.copertina} <> ''`))
    .orderBy(asc(uscite.dataUscita), asc(uscite.titolo)).limit(8)).map(daUscita);
  const visti = new Set<string>();
  const appena = [...arrivati, ...usciti].filter((p) => (visti.has(p.codice) ? false : (visti.add(p.codice), true))).slice(0, 8);
  const ms = await mappaSerie();
  const senzaAdulti = (l: Prodotto[]) => l.map((p) => conSerie(p, ms)).filter((p) => !p.adulti);
  return { appena: senzaAdulti(appena), prossime: senzaAdulti(prossime) };
}

/** Legge i filtri dall'indirizzo (?cerca=&cat=&stato=&editore=&mese=&ordine=&pagina=), accettando solo valori validi. */
export function filtriDaIndirizzo(url: URL, disponibili: Categoria[], base: Partial<Filtri> = {}): Filtri & { cat: Categoria | '' } {
  const q = url.searchParams;
  const cat = (disponibili as string[]).includes(q.get('cat') ?? '') ? (q.get('cat') as Categoria) : '';
  const stato = q.get('stato');
  const ordine = q.get('ordine');
  return {
    ...base,
    cat,
    categorie: cat ? [cat] : disponibili,
    cerca: (q.get('cerca') ?? '').trim().slice(0, 60) || undefined,
    stato: stato === 'negozio' || stato === 'preordini' ? stato : (base.stato ?? 'tutti'),
    editori: [...new Set(q.getAll('editore').map((e) => e.slice(0, 80)).filter(Boolean))].slice(0, 30),
    generi: [...new Set(q.getAll('genere').filter((g) => (GENERI as readonly string[]).includes(g)))],
    mese: /^\d{4}-\d{2}$/.test(q.get('mese') ?? '') ? q.get('mese')! : undefined,
    ordine: ordine === 'uscita' || ordine === 'prezzo' || ordine === 'titolo' || ordine === 'recenti' ? ordine : (base.ordine ?? 'recenti'),
    pagina: Math.max(1, Math.min(500, Number(q.get('pagina')) || 1)),
  };
}

/* Catalogo: articoli visibili del magazzino + uscite visibili (decisione di Angelo: niente cataloghi editori né dati presunti). */
import { and, asc, eq, gte, inArray, like, or, sql, type Column, type SQL } from 'drizzle-orm';
import { articoli, db, uscite } from '../../db';
import { daArticolo, daUscita } from './conversione';
import { giorniFa } from './formati';
import { conGenereEEta, leggiSchedeSerie } from './genere-eta';
import { GENERI, type Categoria, type CategoriaUscita, type Prodotto } from './tipi';

export type Ordine = 'recenti' | 'uscita' | 'prezzo' | 'prezzo-alto' | 'titolo';
export type Stato = 'tutti' | 'negozio' | 'preordini';

export type Filtri = {
  categorie: Categoria[];
  cerca?: string;
  stato?: Stato;
  editori?: string[];
  generi?: string[];
  /** ?adulti=1: mostra SOLO i titoli per adulti, se il visitatore ha confermato di essere maggiorenne */
  soloAdulti?: boolean;
  etaConfermata?: boolean;
  /** AAAA-MM, solo per le uscite */
  mese?: string;
  ordine?: Ordine;
  pagina?: number;
  perPagina?: number;
};

export type Risultato = {
  prodotti: Prodotto[];
  totale: number;
  pagine: number;
  pagina: number;
  editori: string[];
  mesi: string[];
  generi: string[];
  titoliPerAdulti: number;
};

const PRODOTTI_PER_PAGINA = 20;
const GIORNI_IN_CUI_UNA_USCITA_RESTA_VISIBILE = 30;
const CATEGORIE_CON_USCITE: CategoriaUscita[] = ['manga', 'fumetti', 'tcg', 'giochi'];

/* ---------- lettura dal database ---------- */

/** Ogni parola cercata deve comparire nel titolo, nell'editore o (se c'è) nell'autore. */
function condizioneDiRicerca(campi: Column[], testo: string): SQL | undefined {
  const parole = testo
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 5);
  if (!parole.length) return undefined;
  return and(
    ...parole.map((parola) => {
      const motivo = '%' + parola.replace(/[%_]/g, '') + '%';
      return or(...campi.map((campo) => like(sql`lower(${campo})`, motivo)));
    }),
  );
}

async function leggiMagazzino(filtri: Filtri): Promise<Prodotto[]> {
  const condizioni: SQL[] = [eq(articoli.visibile, true)];
  const ricerca =
    filtri.cerca && condizioneDiRicerca([articoli.titolo, articoli.editore, articoli.autore], filtri.cerca);
  if (ricerca) condizioni.push(ricerca);

  const righe = await db()
    .select()
    .from(articoli)
    .where(and(...condizioni))
    .limit(2000);
  return righe
    .map(daArticolo)
    .filter((p) => p.categoria && filtri.categorie.includes(p.categoria) && p.disponibilita !== 'preordine');
}

async function leggiUscite(filtri: Filtri): Promise<Prodotto[]> {
  const categorie = CATEGORIE_CON_USCITE.filter((c) => filtri.categorie.includes(c));
  if (!categorie.length) return [];

  const condizioni: SQL[] = [
    eq(uscite.visibile, true),
    gte(uscite.dataUscita, giorniFa(GIORNI_IN_CUI_UNA_USCITA_RESTA_VISIBILE)),
    inArray(uscite.categoria, categorie),
  ];
  const ricerca = filtri.cerca && condizioneDiRicerca([uscite.titolo, uscite.editore], filtri.cerca);
  if (ricerca) condizioni.push(ricerca);
  if (filtri.mese) condizioni.push(like(uscite.dataUscita, filtri.mese + '%'));

  const righe = await db()
    .select()
    .from(uscite)
    .where(and(...condizioni))
    .orderBy(asc(uscite.dataUscita), asc(uscite.titolo))
    .limit(3000);
  return righe.map(daUscita);
}

/** Se lo stesso prodotto è sia in magazzino sia tra le uscite, vale il magazzino. */
function unisciSenzaDoppioni(magazzino: Prodotto[], prossime: Prodotto[]): Prodotto[] {
  const inMagazzino = new Set(magazzino.map((p) => p.codice));
  return [...magazzino, ...prossime.filter((p) => !inMagazzino.has(p.codice))];
}

/* ---------- ordinamento ---------- */

const perTitolo = (a: Prodotto, b: Prodotto) => a.titolo.localeCompare(b.titolo, 'it', { numeric: true });
const perUscita = (a: Prodotto, b: Prodotto) =>
  (a.dataUscita ?? '9999').localeCompare(b.dataUscita ?? '9999');
const piuRecente = (a: Prodotto, b: Prodotto) => (b.dataUscita ?? '').localeCompare(a.dataUscita ?? '');

/** Prima ciò che è in negozio (dal più recente), poi le uscite da prenotare (dalla più vicina), infine quelle appena uscite. */
function inEvidenza(a: Prodotto, b: Prodotto): number {
  const gruppo = (p: Prodotto) => (p.tipo === 'magazzino' ? 0 : p.disponibilita === 'preordine' ? 1 : 2);
  if (gruppo(a) !== gruppo(b)) return gruppo(a) - gruppo(b);
  const perData = a.tipo === 'magazzino' ? piuRecente(a, b) : perUscita(a, b);
  return perData || perTitolo(a, b);
}

const ORDINAMENTI: Record<Ordine, (a: Prodotto, b: Prodotto) => number> = {
  recenti: inEvidenza,
  uscita: (a, b) => perUscita(a, b) || perTitolo(a, b),
  prezzo: (a, b) => (a.prezzo ?? Infinity) - (b.prezzo ?? Infinity) || perTitolo(a, b),
  'prezzo-alto': (a, b) => (b.prezzo ?? -Infinity) - (a.prezzo ?? -Infinity) || perTitolo(a, b),
  titolo: perTitolo,
};

/* ---------- filtri applicati in memoria ---------- */

const soloAdultiOSenza = (prodotti: Prodotto[], filtri: Filtri) =>
  filtri.soloAdulti && filtri.etaConfermata
    ? prodotti.filter((p) => p.perAdulti)
    : prodotti.filter((p) => !p.perAdulti);

const conAlmenoUnGenere = (prodotti: Prodotto[], generi: string[]) =>
  generi.length ? prodotti.filter((p) => p.generi.some((g) => generi.includes(g))) : prodotti;

const degliEditori = (prodotti: Prodotto[], editori: string[]) =>
  editori.length ? prodotti.filter((p) => p.editore && editori.includes(p.editore)) : prodotti;

const generiPresenti = (prodotti: Prodotto[]) =>
  GENERI.filter((g) => prodotti.some((p) => p.generi.includes(g)));

const editoriPresenti = (prodotti: Prodotto[]) =>
  [...new Set(prodotti.map((p) => p.editore).filter((e): e is string => !!e))].sort((a, b) =>
    a.localeCompare(b),
  );

const mesiPresenti = (prodotti: Prodotto[]) =>
  [
    ...new Set(
      prodotti.filter((p) => p.tipo === 'uscita' && p.dataUscita).map((p) => p.dataUscita!.slice(0, 7)),
    ),
  ].sort();

function impagina(prodotti: Prodotto[], paginaChiesta = 1, perPagina = PRODOTTI_PER_PAGINA) {
  const pagine = Math.max(1, Math.ceil(prodotti.length / perPagina));
  const pagina = Math.min(Math.max(1, paginaChiesta), pagine);
  return {
    prodotti: prodotti.slice((pagina - 1) * perPagina, pagina * perPagina),
    totale: prodotti.length,
    pagine,
    pagina,
  };
}

/* ---------- ricerca completa ---------- */

export async function cercaProdotti(filtri: Filtri): Promise<Risultato> {
  const stato = filtri.stato ?? 'tutti';
  const [magazzino, prossime, schede] = await Promise.all([
    stato === 'preordini' ? [] : leggiMagazzino(filtri),
    stato === 'negozio' ? [] : leggiUscite(filtri),
    leggiSchedeSerie(),
  ]);

  const tutti = unisciSenzaDoppioni(magazzino, prossime).map((p) => conGenereEEta(p, schede));
  const titoliPerAdulti = tutti.filter((p) => p.perAdulti).length;

  // i menu di genere ed editore mostrano tutte le scelte possibili, non solo quelle già scelte
  const visibili = soloAdultiOSenza(tutti, filtri);
  const delGenere = conAlmenoUnGenere(visibili, filtri.generi ?? []).sort(
    ORDINAMENTI[filtri.ordine ?? 'recenti'],
  );
  const finali = degliEditori(delGenere, filtri.editori ?? []);

  return {
    ...impagina(finali, filtri.pagina, filtri.perPagina),
    generi: generiPresenti(visibili),
    editori: editoriPresenti(delGenere),
    mesi: mesiPresenti(finali),
    titoliPerAdulti,
  };
}

/* ---------- filtri dall'indirizzo ---------- */

const ORDINI: Ordine[] = ['recenti', 'uscita', 'prezzo', 'prezzo-alto', 'titolo'];
const STATI: Stato[] = ['negozio', 'preordini'];

export type FiltriDellaPagina = Filtri & { cat: Categoria | '' };

/** Legge ?cerca=&cat=&stato=&editore=&genere=&adulti=&mese=&ordine=&pagina= accettando solo valori validi. */
export function filtriDaIndirizzo(
  url: URL,
  disponibili: Categoria[],
  base: Partial<Filtri> = {},
): FiltriDellaPagina {
  const q = url.searchParams;
  const valore = (nome: string) => q.get(nome) ?? '';
  const cat = (disponibili as string[]).includes(valore('cat')) ? (valore('cat') as Categoria) : '';

  return {
    ...base,
    cat,
    categorie: cat ? [cat] : disponibili,
    cerca: valore('cerca').trim().slice(0, 60) || undefined,
    stato: (STATI as string[]).includes(valore('stato'))
      ? (valore('stato') as Stato)
      : (base.stato ?? 'tutti'),
    editori: [
      ...new Set(
        q
          .getAll('editore')
          .map((e) => e.slice(0, 80))
          .filter(Boolean),
      ),
    ].slice(0, 30),
    generi: [...new Set(q.getAll('genere').filter((g) => (GENERI as readonly string[]).includes(g)))],
    soloAdulti: valore('adulti') === '1',
    mese: /^\d{4}-\d{2}$/.test(valore('mese')) ? valore('mese') : undefined,
    ordine: (ORDINI as string[]).includes(valore('ordine'))
      ? (valore('ordine') as Ordine)
      : (base.ordine ?? 'recenti'),
    pagina: Math.max(1, Math.min(500, Number(valore('pagina')) || 1)),
  };
}

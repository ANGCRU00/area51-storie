import { and, asc, eq, gte, like, or, sql, type SQL } from 'drizzle-orm';
import { articoli, db, uscite } from '../../db';
import { daArticolo, daUscita } from './conversione';
import { oggi } from './formati';
import { conGenereEEta, leggiSchedeSerie } from './genere-eta';
import type { Prodotto } from './tipi';

export type SchedaProdotto = {
  prodotto: Prodotto;
  /** altri volumi della stessa serie */
  altri: Prodotto[];
  /** altre edizioni dello stesso volume (es. Variant) */
  edizioni: Prodotto[];
  /** "ti potrebbe piacere": stesso editore, altre serie */
  simili: Prodotto[];
};

const CODICE_VALIDO = /^[A-Za-z0-9-]{4,40}$/;

/** Il prodotto visibile sul sito con questo codice: prima il magazzino, poi le uscite. */
export async function prodottoPerCodice(codice: string): Promise<Prodotto | null> {
  const [articolo] = await db()
    .select()
    .from(articoli)
    .where(
      and(eq(articoli.visibile, true), or(eq(articoli.ean, codice), eq(articoli.codiceStarshop, codice))),
    )
    .limit(1);
  if (articolo) return daArticolo(articolo);

  const [uscita] = await db()
    .select()
    .from(uscite)
    .where(
      and(
        eq(uscite.visibile, true),
        or(eq(uscite.ean, codice), eq(uscite.riferimentoEsterno, codice), eq(uscite.id, codice)),
      ),
    )
    .limit(1);
  return uscita ? daUscita(uscita) : null;
}

async function stessoCodiceSerie(codiceSerie: string): Promise<Prodotto[]> {
  const [delMagazzino, delleUscite] = await Promise.all([
    db()
      .select()
      .from(articoli)
      .where(and(eq(articoli.visibile, true), eq(articoli.codicePadre, codiceSerie)))
      .limit(40),
    db()
      .select()
      .from(uscite)
      .where(and(eq(uscite.visibile, true), eq(uscite.codicePadre, codiceSerie)))
      .limit(40),
  ]);
  return [...delMagazzino.map(daArticolo), ...delleUscite.map(daUscita)];
}

/** Le edizioni speciali possono avere un codice di serie diverso: si cercano anche per nome della serie. */
async function stessoNomeSerie(nomeSerie: string): Promise<Prodotto[]> {
  const righe = await db()
    .select()
    .from(uscite)
    .where(and(eq(uscite.visibile, true), like(uscite.titolo, nomeSerie.replace(/[%_]/g, '') + '%')))
    .limit(40);
  return righe.map(daUscita).filter((p) => p.serie === nomeSerie);
}

async function stessoEditoreAltreSerie(prodotto: Prodotto): Promise<Prodotto[]> {
  if (!prodotto.editore) return [];
  const condizioni: SQL[] = [
    eq(uscite.visibile, true),
    eq(uscite.editore, prodotto.editore),
    sql`${uscite.copertina} <> ''`,
    gte(uscite.dataUscita, oggi()),
  ];
  if (prodotto.codiceSerie)
    condizioni.push(sql`coalesce(${uscite.codicePadre}, '') <> ${prodotto.codiceSerie}`);

  const righe = await db()
    .select()
    .from(uscite)
    .where(and(...condizioni))
    .orderBy(asc(uscite.dataUscita))
    .limit(12);
  return righe.map(daUscita).filter((p) => p.serie !== prodotto.serie);
}

function senzaRipetizioni(gia: Set<string>) {
  return (p: Prodotto) => {
    if (gia.has(p.codice)) return false;
    gia.add(p.codice);
    return true;
  };
}

const perVolumeEUscita = (a: Prodotto, b: Prodotto) =>
  Number(a.volume ?? 0) - Number(b.volume ?? 0) || (a.dataUscita ?? '').localeCompare(b.dataUscita ?? '');

export async function trovaProdotto(codice: string): Promise<SchedaProdotto | null> {
  if (!CODICE_VALIDO.test(codice)) return null;
  const trovato = await prodottoPerCodice(codice);
  if (!trovato) return null;

  const schede = await leggiSchedeSerie();
  const conDati = (p: Prodotto) => conGenereEEta(p, schede);
  const prodotto = conDati(trovato);
  const nuovo = senzaRipetizioni(new Set([prodotto.codice]));

  const dellaSerie = [
    ...(prodotto.codiceSerie && prodotto.codiceSerie.length >= 6
      ? await stessoCodiceSerie(prodotto.codiceSerie)
      : []),
    ...(prodotto.volume && prodotto.serie.length >= 3 ? await stessoNomeSerie(prodotto.serie) : []),
  ]
    .filter(nuovo)
    .map(conDati);

  const edizioni = dellaSerie.filter((p) => p.volume && p.volume === prodotto.volume);
  const altri = dellaSerie
    .filter((p) => !edizioni.includes(p))
    .sort(perVolumeEUscita)
    .slice(0, 12);
  const simili = (await stessoEditoreAltreSerie(prodotto))
    .filter(nuovo)
    .slice(0, 4)
    .map(conDati)
    .filter((p) => !p.perAdulti || prodotto.perAdulti);

  return { prodotto, altri, edizioni, simili };
}

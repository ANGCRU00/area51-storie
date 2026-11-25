import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { articoli, db, uscite } from '../../db';
import { daArticolo, daUscita } from './conversione';
import { giorniFa, oggi } from './formati';
import { conGenereEEta, leggiSchedeSerie } from './genere-eta';
import type { Prodotto } from './tipi';

const QUANTI = 8;
const conCopertina = sql`${uscite.copertina} <> ''`;

async function arrivatiInNegozio(): Promise<Prodotto[]> {
  const righe = await db()
    .select()
    .from(articoli)
    .where(and(eq(articoli.visibile, true), inArray(articoli.stato, ['appena_arrivato', 'disponibile'])))
    .orderBy(desc(articoli.dataArrivo), desc(articoli.aggiornatoIl))
    .limit(QUANTI);
  return righe.map(daArticolo);
}

async function uscitiNelMeseScorso(): Promise<Prodotto[]> {
  const righe = await db()
    .select()
    .from(uscite)
    .where(
      and(
        eq(uscite.visibile, true),
        lte(uscite.dataUscita, oggi()),
        gte(uscite.dataUscita, giorniFa(30)),
        conCopertina,
      ),
    )
    .orderBy(desc(uscite.dataUscita), asc(uscite.titolo))
    .limit(QUANTI);
  return righe.map(daUscita);
}

async function prossimeUscite(): Promise<Prodotto[]> {
  const righe = await db()
    .select()
    .from(uscite)
    .where(and(eq(uscite.visibile, true), sql`${uscite.dataUscita} > ${oggi()}`, conCopertina))
    .orderBy(asc(uscite.dataUscita), asc(uscite.titolo))
    .limit(QUANTI);
  return righe.map(daUscita);
}

function senzaDoppioni(prodotti: Prodotto[]): Prodotto[] {
  const visti = new Set<string>();
  return prodotti.filter((p) => !visti.has(p.codice) && !!visti.add(p.codice));
}

/** La home non mostra mai titoli per adulti. */
export async function perLaHome(): Promise<{ appena: Prodotto[]; prossime: Prodotto[] }> {
  const [arrivati, usciti, inArrivo, schede] = await Promise.all([
    arrivatiInNegozio(),
    uscitiNelMeseScorso(),
    prossimeUscite(),
    leggiSchedeSerie(),
  ]);
  const perTutti = (prodotti: Prodotto[]) =>
    prodotti.map((p) => conGenereEEta(p, schede)).filter((p) => !p.perAdulti);
  return {
    appena: perTutti(senzaDoppioni([...arrivati, ...usciti]).slice(0, QUANTI)),
    prossime: perTutti(inArrivo),
  };
}

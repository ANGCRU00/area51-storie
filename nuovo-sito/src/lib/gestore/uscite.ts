/* Area gestore: le prossime uscite (da Starshop o a mano). Il gestore decide se mostrarle sul sito e fino a
   quando si prenotano (data limite); la sincronizzazione notturna non tocca queste due scelte. */
import { and, asc, count, eq, gte, like, or, type SQL } from 'drizzle-orm';
import { db, uscite } from '../../db';
import { oggi } from '../prodotti';

export const USCITE_PER_PAGINA = 50;
export const FILTRI_USCITE = ['prossime', 'nascoste', 'tutte'] as const;
export type FiltroUscite = (typeof FILTRI_USCITE)[number];

function condizioni(filtro: FiltroUscite, cerca: string): SQL | undefined {
  const parti: (SQL | undefined)[] = [];
  if (filtro === 'prossime') parti.push(gte(uscite.dataUscita, oggi()));
  if (filtro === 'nascoste') parti.push(eq(uscite.visibile, false));
  for (const parola of cerca.split(/\s+/).filter(Boolean).slice(0, 5)) {
    const testo = `%${parola.replace(/[%_]/g, '')}%`;
    parti.push(or(like(uscite.titolo, testo), like(uscite.editore, testo), like(uscite.ean, testo)));
  }
  return and(...parti);
}

export async function uscitePerIlGestore(filtro: FiltroUscite, cerca: string, pagina: number) {
  const dove = condizioni(filtro, cerca);
  const [righe, [totale]] = await Promise.all([
    db()
      .select({
        id: uscite.id,
        titolo: uscite.titolo,
        editore: uscite.editore,
        categoria: uscite.categoria,
        dataUscita: uscite.dataUscita,
        dataLimite: uscite.dataLimite,
        visibile: uscite.visibile,
        prezzo: uscite.prezzo,
        ean: uscite.ean,
        riferimentoEsterno: uscite.riferimentoEsterno,
        copertina: uscite.copertina,
      })
      .from(uscite)
      .where(dove)
      .orderBy(asc(uscite.dataUscita), asc(uscite.titolo))
      .limit(USCITE_PER_PAGINA)
      .offset((pagina - 1) * USCITE_PER_PAGINA),
    db().select({ n: count() }).from(uscite).where(dove),
  ]);
  return { righe, totale: totale?.n ?? 0 };
}

export type ModificaUscita = { visibile?: boolean; dataLimite?: string | null };

export async function modificaUscita(id: string, modifica: ModificaUscita) {
  if (!Object.keys(modifica).length) return null;
  const [aggiornata] = await db()
    .update(uscite)
    .set({ ...modifica, aggiornatoIl: new Date().toISOString().slice(0, 19) + 'Z' })
    .where(eq(uscite.id, id))
    .returning({ id: uscite.id, visibile: uscite.visibile, dataLimite: uscite.dataLimite });
  return aggiornata ?? null;
}

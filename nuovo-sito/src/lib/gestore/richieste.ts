/* Area gestore: le richieste "Chiedicelo" della pagina /negozio e il loro stato. */
import { desc, eq, inArray } from 'drizzle-orm';
import { db, richieste, STATI_RICHIESTA } from '../../db';

export type StatoRichiesta = (typeof STATI_RICHIESTA)[number];
export const FILTRI_RICHIESTE = ['aperte', 'chiuse', 'tutte'] as const;
export type FiltroRichieste = (typeof FILTRI_RICHIESTE)[number];

const APERTE: StatoRichiesta[] = ['nuova', 'in_lavorazione'];
const CHIUSE: StatoRichiesta[] = ['evasa', 'non_disponibile'];

export async function richiestePerIlGestore(filtro: FiltroRichieste) {
  const stati = filtro === 'aperte' ? APERTE : filtro === 'chiuse' ? CHIUSE : null;
  return db()
    .select()
    .from(richieste)
    .where(stati ? inArray(richieste.stato, stati) : undefined)
    .orderBy(desc(richieste.creataIl))
    .limit(300);
}

export async function cambiaStatoRichiesta(id: number, stato: StatoRichiesta) {
  const [aggiornata] = await db().update(richieste).set({ stato }).where(eq(richieste.id, id)).returning();
  return aggiornata ?? null;
}

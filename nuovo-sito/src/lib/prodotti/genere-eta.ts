import { db, serie } from '../../db';
import type { Prodotto } from './tipi';

type GenereEEta = { generi: string[]; perAdulti: boolean };
export type SchedeSerie = Map<string, GenereEEta>;

/** La tabella delle serie è piccola: si legge tutta in una volta. */
export async function leggiSchedeSerie(): Promise<SchedeSerie> {
  const righe = await db()
    .select({ chiave: serie.chiave, generi: serie.generi, adulti: serie.adulti })
    .from(serie);
  return new Map(righe.map((r) => [r.chiave, { generi: r.generi ?? [], perAdulti: r.adulti }]));
}

export function conGenereEEta(prodotto: Prodotto, schede: SchedeSerie): Prodotto {
  const scheda = prodotto.codiceSerie ? schede.get(prodotto.codiceSerie) : undefined;
  return scheda ? { ...prodotto, ...scheda } : prodotto;
}

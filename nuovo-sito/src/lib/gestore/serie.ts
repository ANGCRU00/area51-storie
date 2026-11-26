/* Area gestore: genere ed età delle serie. Per i manga c'è la proposta di AniList (da controllare: alcuni
   abbinamenti sono sbagliati); per le altre serie il gestore li assegna da zero. Una serie confermata non viene
   più toccata dallo script di AniList. */
import { sql } from 'drizzle-orm';
import { db, GENERI, serie, uscite } from '../../db';
import { serieEVolume } from '../prodotti/titoli';
import type { Categoria } from '../prodotti';

export const SERIE_PER_PAGINA = 40;
export const FILTRI_SERIE = ['da-confermare', 'per-adulti', 'confermate', 'tutte'] as const;
export type FiltroSerie = (typeof FILTRI_SERIE)[number];

export type SchedaSerie = {
  chiave: string;
  nome: string;
  categoria: string | null;
  volumi: number;
  generi: string[];
  adulti: boolean;
  confermata: boolean;
  proposta: { titolo: string; generi: string[]; somiglianza: number | null; id: number | null } | null;
};

async function serieDalleUscite() {
  const righe = await db()
    .select({
      chiave: uscite.codicePadre,
      titolo: uscite.titolo,
      numero: uscite.numero,
      categoria: uscite.categoria,
    })
    .from(uscite)
    .where(sql`${uscite.codicePadre} IS NOT NULL AND length(${uscite.codicePadre}) >= 6`);
  const perChiave = new Map<string, { nome: string; categoria: string | null; volumi: number }>();
  for (const r of righe) {
    const chiave = r.chiave!;
    const gia = perChiave.get(chiave);
    if (gia) {
      gia.volumi++;
      continue;
    }
    const { serie: nome } = serieEVolume(r.titolo, r.numero, r.categoria as Categoria | null);
    perChiave.set(chiave, { nome, categoria: r.categoria, volumi: 1 });
  }
  return perChiave;
}

export async function seriePerIlGestore(filtro: FiltroSerie, cerca: string, pagina: number) {
  const [dalleUscite, schede] = await Promise.all([serieDalleUscite(), db().select().from(serie)]);
  const perChiave = new Map(schede.map((s) => [s.chiave, s]));
  const tutte: SchedaSerie[] = [...dalleUscite].map(([chiave, u]) => {
    const s = perChiave.get(chiave);
    return {
      chiave,
      nome: s?.nome ?? u.nome,
      categoria: u.categoria,
      volumi: u.volumi,
      generi: s?.generi ?? [],
      adulti: s?.adulti ?? false,
      confermata: s?.confermata ?? false,
      proposta: s?.anilistTitolo
        ? {
            titolo: s.anilistTitolo,
            generi: s.anilistGeneri ?? [],
            somiglianza: s.somiglianza,
            id: s.anilistId,
          }
        : null,
    };
  });

  const testo = cerca.toLowerCase();
  const scelte = tutte
    .filter((s) => !testo || s.nome.toLowerCase().includes(testo))
    .filter((s) =>
      filtro === 'da-confermare'
        ? !s.confermata
        : filtro === 'per-adulti'
          ? s.adulti
          : filtro === 'confermate'
            ? s.confermata
            : true,
    )
    .sort(
      (a, b) =>
        Number(!!b.proposta) - Number(!!a.proposta) ||
        Number(b.adulti) - Number(a.adulti) ||
        a.nome.localeCompare(b.nome),
    );

  return {
    righe: scelte.slice((pagina - 1) * SERIE_PER_PAGINA, pagina * SERIE_PER_PAGINA),
    totale: scelte.length,
    daConfermare: tutte.filter((s) => !s.confermata).length,
  };
}

export const generiValidi = (v: unknown): string[] | null =>
  Array.isArray(v) &&
  v.length <= GENERI.length &&
  v.every((g) => (GENERI as readonly string[]).includes(g as string))
    ? [...new Set(v as string[])]
    : null;

/** Il gestore conferma (o corregge) genere ed età di una serie. */
export async function confermaSerie(chiave: string, nome: string, generi: string[], adulti: boolean) {
  const adesso = new Date().toISOString().slice(0, 19) + 'Z';
  const [salvata] = await db()
    .insert(serie)
    .values({ chiave, nome, generi, adulti, fonte: 'gestore', confermata: true, aggiornataIl: adesso })
    .onConflictDoUpdate({
      target: serie.chiave,
      set: { generi, adulti, confermata: true, aggiornataIl: adesso },
    })
    .returning();
  return salvata;
}

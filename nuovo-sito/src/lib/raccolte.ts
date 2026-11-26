/* Preferiti e serie seguite dei clienti con account. Il browser tiene una copia sul dispositivo (lib/negozio.ts):
   al primo accesso da un dispositivo le due liste si uniscono, poi comanda quella salvata qui. */
import { and, asc, eq, gt, inArray, like } from 'drizzle-orm';
import { db, preferiti, serieSeguite, uscite } from '../db';
import { oggi } from './prodotti';

export const MASSIMO_PREFERITI = 200;
export const MASSIMO_SERIE = 100;

export type PreferitoSalvato = { k: string; t: string; p: number; l: string; i: string; e: string };
export type SerieSalvata = { s: string; e: string; c?: string };
export type ProssimaUscita = { titolo: string; data: string; codice: string };
export type SerieConUscita = SerieSalvata & { prossima: ProssimaUscita | null };

const testo = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const percorsoInterno = (v: unknown, max: number) => {
  const p = testo(v, max);
  return p.startsWith('/') && !p.startsWith('//') ? p : '';
};

export function preferitoValido(v: unknown): PreferitoSalvato | null {
  if (!v || typeof v !== 'object') return null;
  const x = v as Record<string, unknown>;
  const k = testo(x.k, 60);
  const t = testo(x.t, 200);
  const l = percorsoInterno(x.l, 300);
  if (!k || !t || !l) return null;
  const p = Number(x.p);
  return {
    k,
    t,
    p: Number.isFinite(p) && p > 0 && p < 10_000 ? Math.round(p * 100) / 100 : 0,
    l,
    i: percorsoInterno(x.i, 300),
    e: testo(x.e, 120),
  };
}

export function serieValida(v: unknown): SerieSalvata | null {
  if (!v || typeof v !== 'object') return null;
  const x = v as Record<string, unknown>;
  const s = testo(x.s, 120);
  if (!s) return null;
  const c = testo(x.c, 40);
  return { s, e: testo(x.e, 120), ...(/^[A-Za-z0-9-]+$/.test(c) ? { c } : {}) };
}

export const elencoDi = <T>(v: unknown, valida: (x: unknown) => T | null, massimo: number): T[] =>
  (Array.isArray(v) ? v.slice(0, massimo) : []).map(valida).filter((x): x is T => x !== null);

async function preferitiDi(utenteId: string): Promise<PreferitoSalvato[]> {
  const righe = await db()
    .select()
    .from(preferiti)
    .where(eq(preferiti.utenteId, utenteId))
    .orderBy(asc(preferiti.creatoIl));
  return righe.map((r) => ({
    k: r.codice,
    t: r.titolo,
    p: r.prezzo ?? 0,
    l: r.indirizzo,
    i: r.copertina,
    e: r.editore,
  }));
}

async function serieDi(utenteId: string): Promise<SerieSalvata[]> {
  const righe = await db()
    .select()
    .from(serieSeguite)
    .where(eq(serieSeguite.utenteId, utenteId))
    .orderBy(asc(serieSeguite.creataIl));
  return righe.map((r) => ({ s: r.nome, e: r.editore, ...(r.codiceSerie ? { c: r.codiceSerie } : {}) }));
}

export async function raccolteDi(utenteId: string) {
  const [elencoPreferiti, elencoSerie] = await Promise.all([preferitiDi(utenteId), serieDi(utenteId)]);
  return { preferiti: elencoPreferiti, serie: elencoSerie };
}

const stessaSerie = (a: SerieSalvata, b: SerieSalvata) =>
  a.s.toLowerCase() === b.s.toLowerCase() && a.e === b.e;

/** Aggiunge senza doppioni e senza superare i massimi; le voci già salvate restano come sono. */
export async function aggiungiARaccolte(
  utenteId: string,
  nuoviPreferiti: PreferitoSalvato[],
  nuoveSerie: SerieSalvata[],
) {
  const attuali = await raccolteDi(utenteId);
  const codiciPresenti = new Set(attuali.preferiti.map((p) => p.k));
  const preferitiDaAggiungere: PreferitoSalvato[] = [];
  for (const p of nuoviPreferiti) {
    if (codiciPresenti.has(p.k)) continue;
    codiciPresenti.add(p.k);
    preferitiDaAggiungere.push(p);
  }
  preferitiDaAggiungere.splice(Math.max(0, MASSIMO_PREFERITI - attuali.preferiti.length));
  const serieDaAggiungere: SerieSalvata[] = [];
  for (const s of nuoveSerie) {
    const giaPresente = [...attuali.serie, ...serieDaAggiungere].some((x) => stessaSerie(x, s));
    if (!giaPresente) serieDaAggiungere.push(s);
  }
  serieDaAggiungere.splice(Math.max(0, MASSIMO_SERIE - attuali.serie.length));

  const scritture = [
    ...preferitiDaAggiungere.map((p) =>
      db()
        .insert(preferiti)
        .values({
          utenteId,
          codice: p.k,
          titolo: p.t,
          prezzo: p.p || null,
          indirizzo: p.l,
          copertina: p.i,
          editore: p.e,
        })
        .onConflictDoNothing(),
    ),
    ...serieDaAggiungere.map((s) =>
      db()
        .insert(serieSeguite)
        .values({ utenteId, nome: s.s, editore: s.e, codiceSerie: s.c ?? null })
        .onConflictDoNothing(),
    ),
  ];
  if (scritture.length) await db().batch(scritture as [(typeof scritture)[number]]);
  return raccolteDi(utenteId);
}

export async function togliPreferito(utenteId: string, codice: string) {
  await db()
    .delete(preferiti)
    .where(and(eq(preferiti.utenteId, utenteId), eq(preferiti.codice, codice)));
}

export async function togliSerie(utenteId: string, serie: SerieSalvata) {
  const salvate = await serieDi(utenteId);
  const daTogliere = salvate.filter((x) => stessaSerie(x, serie));
  for (const x of daTogliere) {
    await db()
      .delete(serieSeguite)
      .where(
        and(eq(serieSeguite.utenteId, utenteId), eq(serieSeguite.nome, x.s), eq(serieSeguite.editore, x.e)),
      );
  }
}

/* ---------- prossime uscite delle serie seguite ---------- */

const uscitaFutura = () => and(eq(uscite.visibile, true), gt(uscite.dataUscita, oggi()));
const comeProssima = (u: typeof uscite.$inferSelect): ProssimaUscita => ({
  titolo: u.titolo,
  data: u.dataUscita ?? '',
  codice: u.ean || u.riferimentoEsterno || u.id,
});

async function prossimePerCodice(codici: string[]): Promise<Map<string, ProssimaUscita>> {
  const trovate = new Map<string, ProssimaUscita>();
  if (!codici.length) return trovate;
  const righe = await db()
    .select()
    .from(uscite)
    .where(and(uscitaFutura(), inArray(uscite.codicePadre, codici)))
    .orderBy(asc(uscite.dataUscita));
  for (const u of righe)
    if (u.codicePadre && !trovate.has(u.codicePadre)) trovate.set(u.codicePadre, comeProssima(u));
  return trovate;
}

async function prossimaPerNome(serie: SerieSalvata): Promise<ProssimaUscita | null> {
  const [u] = await db()
    .select()
    .from(uscite)
    .where(
      and(
        uscitaFutura(),
        like(uscite.titolo, serie.s + ' %'),
        serie.e ? eq(uscite.editore, serie.e) : undefined,
      ),
    )
    .orderBy(asc(uscite.dataUscita))
    .limit(1);
  return u ? comeProssima(u) : null;
}

export async function serieConProssimeUscite(serie: SerieSalvata[]): Promise<SerieConUscita[]> {
  const perCodice = await prossimePerCodice(serie.flatMap((s) => (s.c ? [s.c] : [])));
  return Promise.all(
    serie.map(async (s) => ({
      ...s,
      prossima: (s.c && perCodice.get(s.c)) || (await prossimaPerNome(s)),
    })),
  );
}

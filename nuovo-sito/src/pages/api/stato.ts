/* GET /api/stato: controllo tecnico. Dice se il sito raggiunge il database D1 e lo spazio file R2, con qualche conteggio.
   Chi può usarla: chiunque. Non restituisce dati personali né riservati. */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { count } from 'drizzle-orm';
import { db, uscite, articoli } from '../../db';
import { json } from '../../lib/api';

export const prerender = false;

export const GET: APIRoute = async () => {
  const r: Record<string, unknown> = { ora: new Date().toISOString() };
  try {
    const [u] = await db().select({ n: count() }).from(uscite);
    const [a] = await db().select({ n: count() }).from(articoli);
    r.d1 = { ok: true, uscite: u?.n ?? 0, articoli: a?.n ?? 0 };
  } catch (e) {
    r.d1 = {
      ok: false,
      errore: 'Tabelle non trovate: lancia "npm run db:locale"',
      dettaglio: String(e).slice(0, 200),
    };
  }
  try {
    const l = await env.FILE.list({ prefix: 'copertine/', limit: 1000 });
    r.r2 = { ok: true, copertine: l.objects.length + (l.truncated ? '+' : '') };
  } catch (e) {
    r.r2 = { ok: false, dettaglio: String(e).slice(0, 200) };
  }
  return json(r);
};

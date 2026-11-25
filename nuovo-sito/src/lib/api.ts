/* Aiuti comuni a tutte le interfacce /api: risposte JSON e lettura sicura del corpo della richiesta.
   Regola del progetto: ogni interfaccia dichiara chi può usarla. Quelle pubbliche (come "Chiedicelo") possono solo
   aggiungere dati, mai leggerli; i controlli per cliente e gestore (soloCliente, soloGestore) arrivano con il login (fase 5). */

export function json(dati: unknown, stato = 200): Response {
  return new Response(JSON.stringify(dati), {
    status: stato,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function errore(messaggio: string, stato = 400): Response {
  return json({ ok: false, errore: messaggio }, stato);
}

/** Legge il corpo JSON della richiesta, al massimo `limite` byte. Restituisce null se manca, è troppo grande o non è JSON. */
export async function leggiJson(request: Request, limite = 8_000): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return null;
  const testo = await request.text();
  if (testo.length > limite) return null;
  try {
    const v = JSON.parse(testo);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Testo pulito: stringa, spazi tolti ai lati, lunghezza massima. Stringa vuota se il valore non è un testo. */
export function testo(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export const emailValida = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* GET /api/stato: controllo della fase 1. Dice se il sito raggiunge il database D1 e lo spazio file R2.
   Non restituisce dati riservati. Gira sul Worker a ogni richiesta (non è preparata alla pubblicazione). */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const risposta: Record<string, unknown> = { ora: new Date().toISOString() };
  try {
    const r = await env.DB.prepare('SELECT nota, creato_il FROM prova ORDER BY id DESC LIMIT 1').first<{ nota: string; creato_il: string }>();
    risposta.d1 = { ok: true, ultima_riga: r };
  } catch (e) {
    risposta.d1 = { ok: false, errore: 'Tabella di prova non trovata: lancia "npx wrangler d1 migrations apply area51 --local"', dettaglio: String(e).slice(0, 200) };
  }
  try {
    const elenco = await env.FILE.list({ limit: 5 });
    risposta.r2 = { ok: true, file: elenco.objects.length };
  } catch (e) {
    risposta.r2 = { ok: false, dettaglio: String(e).slice(0, 200) };
  }
  return new Response(JSON.stringify(risposta, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
};

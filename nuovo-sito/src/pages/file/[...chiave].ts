/* GET /file/copertine/<nome>: serve un file dallo spazio R2 (per ora solo le copertine), con cache lunga.
   Chi può usarla: chiunque, ma solo per i file sotto "copertine/" (pubblici per natura). */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const AMMESSI = /^copertine\/[A-Za-z0-9._-]{1,80}\.(jpg|jpeg|png|webp)$/;

export const GET: APIRoute = async ({ params }) => {
  const chiave = params.chiave ?? '';
  if (!AMMESSI.test(chiave)) return new Response('Non trovato', { status: 404 });
  const ogg = await env.FILE.get(chiave);
  if (!ogg) return new Response('Non trovato', { status: 404 });
  const h = new Headers();
  ogg.writeHttpMetadata(h);
  h.set('etag', ogg.httpEtag);
  h.set('cache-control', 'public, max-age=604800, stale-while-revalidate=86400');
  if (!h.has('content-type')) h.set('content-type', 'image/jpeg');
  return new Response(ogg.body, { headers: h });
};

/* /api/profilo/foto. Chi può usarla: SOLO clienti con account (soloCliente), e solo sulla propria foto.
   GET: la propria foto. PUT (corpo image/jpeg, già ridotta dal browser): la cambia. DELETE: la toglie. */
import type { APIRoute } from 'astro';
import { errore, json } from '../../../lib/api';
import { DIMENSIONE_MASSIMA, leggiFoto, salvaFoto, togliFoto } from '../../../lib/foto-profilo';
import { soloCliente } from '../../../lib/permessi';

export const prerender = false;

export const GET: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const foto = await leggiFoto(cliente.id);
  if (!foto) return new Response('Nessuna foto', { status: 404 });
  return new Response(foto.body, {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'private, max-age=86400',
      etag: foto.httpEtag,
    },
  });
};

export const PUT: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  if (contesto.request.headers.get('content-type') !== 'image/jpeg') return errore("Serve un'immagine JPEG.");
  if (Number(contesto.request.headers.get('content-length') ?? 0) > DIMENSIONE_MASSIMA)
    return errore("L'immagine è troppo grande.");

  const esito = await salvaFoto(cliente.id, new Uint8Array(await contesto.request.arrayBuffer()));
  if (!esito.ok) return errore(esito.errore);
  return json({ ok: true, foto: esito.chiave });
};

export const DELETE: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  await togliFoto(cliente.id);
  return json({ ok: true, foto: '' });
};

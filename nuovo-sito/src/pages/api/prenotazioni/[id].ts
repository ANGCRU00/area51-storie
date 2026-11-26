/* DELETE /api/prenotazioni/<id>: il cliente annulla una sua prenotazione non ancora confermata. Solo clienti con account. */
import type { APIRoute } from 'astro';
import { errore, json } from '../../../lib/api';
import { soloCliente } from '../../../lib/permessi';
import { annullaPrenotazione } from '../../../lib/prenotazioni';

export const prerender = false;

export const DELETE: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const annullata = await annullaPrenotazione(cliente.id, contesto.params.id ?? '');
  if (!annullata)
    return errore('Prenotazione non trovata o già confermata: per cambiarla chiama il negozio.', 404);
  return json({ ok: true });
};

/* /api/prenotazioni. Chi può usarla: SOLO clienti con account (soloCliente).
   POST {codice, copie}: prenota una prossima uscita. GET: le prenotazioni del cliente connesso. */
import type { APIRoute } from 'astro';
import { errore, json, leggiJson, testo } from '../../../lib/api';
import { soloCliente } from '../../../lib/permessi';
import { prenota, prenotazioniDi } from '../../../lib/prenotazioni';

export const prerender = false;

export const GET: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  return json({ ok: true, prenotazioni: await prenotazioniDi(cliente.id) });
};

export const POST: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const dati = await leggiJson(contesto.request);
  if (!dati) return errore('Richiesta non valida.');

  const esito = await prenota(cliente, testo(dati.codice, 40), Number(dati.copie ?? 1), contesto.url.origin);
  if (!esito.ok) return errore(esito.errore, esito.stato);
  return json({ ok: true, prenotazione: esito.prenotazione }, 201);
};

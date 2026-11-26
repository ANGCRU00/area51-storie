/* /api/gestore/prenotazioni. Chi può usarla: SOLO il gestore (soloGestore).
   GET ?filtro=aperte|richiesta|confermata|arrivata|chiuse|tutte: le prenotazioni di tutti i clienti.
   PATCH {id, stato}: cambia lo stato; il cliente riceve un'email per confermata, arrivata e annullata. */
import type { APIRoute } from 'astro';
import { STATI_PRENOTAZIONE } from '../../../db';
import { errore, json, leggiJson, testo } from '../../../lib/api';
import {
  cambiaStatoPrenotazione,
  FILTRI_PRENOTAZIONI,
  prenotazioniPerIlGestore,
  type FiltroPrenotazioni,
  type StatoPrenotazione,
} from '../../../lib/gestore/prenotazioni';
import { soloGestore } from '../../../lib/permessi';

export const prerender = false;

export const GET: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const richiesto = contesto.url.searchParams.get('filtro') ?? 'aperte';
  const filtro = (FILTRI_PRENOTAZIONI as readonly string[]).includes(richiesto)
    ? (richiesto as FiltroPrenotazioni)
    : 'aperte';
  return json({ ok: true, prenotazioni: await prenotazioniPerIlGestore(filtro) });
};

export const PATCH: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const dati = await leggiJson(contesto.request);
  const id = testo(dati?.id, 60);
  const stato = testo(dati?.stato, 20);
  if (!id || !(STATI_PRENOTAZIONE as readonly string[]).includes(stato))
    return errore('Prenotazione o stato non validi.');
  const aggiornata = await cambiaStatoPrenotazione(id, stato as StatoPrenotazione, contesto.url.origin);
  if (!aggiornata) return errore('Prenotazione non trovata.', 404);
  return json({ ok: true, stato: aggiornata.stato });
};

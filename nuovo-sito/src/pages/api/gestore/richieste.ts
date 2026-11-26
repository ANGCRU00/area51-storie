/* /api/gestore/richieste. Chi può usarla: SOLO il gestore (soloGestore).
   GET ?filtro=aperte|chiuse|tutte: le richieste "Chiedicelo". PATCH {id, stato}: cambia lo stato. */
import type { APIRoute } from 'astro';
import { STATI_RICHIESTA } from '../../../db';
import { errore, json, leggiJson, testo } from '../../../lib/api';
import {
  cambiaStatoRichiesta,
  FILTRI_RICHIESTE,
  richiestePerIlGestore,
  type FiltroRichieste,
  type StatoRichiesta,
} from '../../../lib/gestore/richieste';
import { soloGestore } from '../../../lib/permessi';

export const prerender = false;

export const GET: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const richiesto = contesto.url.searchParams.get('filtro') ?? 'aperte';
  const filtro = (FILTRI_RICHIESTE as readonly string[]).includes(richiesto)
    ? (richiesto as FiltroRichieste)
    : 'aperte';
  return json({ ok: true, richieste: await richiestePerIlGestore(filtro) });
};

export const PATCH: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const dati = await leggiJson(contesto.request);
  const id = Number(dati?.id);
  const stato = testo(dati?.stato, 20);
  if (!Number.isInteger(id) || !(STATI_RICHIESTA as readonly string[]).includes(stato))
    return errore('Richiesta o stato non validi.');
  const aggiornata = await cambiaStatoRichiesta(id, stato as StatoRichiesta);
  if (!aggiornata) return errore('Richiesta non trovata.', 404);
  return json({ ok: true, stato: aggiornata.stato });
};

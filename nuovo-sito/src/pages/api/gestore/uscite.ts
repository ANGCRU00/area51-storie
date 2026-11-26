/* /api/gestore/uscite. Chi può usarla: SOLO il gestore (soloGestore).
   GET ?filtro=prossime|nascoste|tutte&cerca=&pagina=: le uscite, 50 per pagina.
   PATCH {id, visibile?, dataLimite?}: mostra o nasconde sul sito, cambia l'ultimo giorno per prenotare (null = da confermare). */
import type { APIRoute } from 'astro';
import { errore, json, leggiJson, testo } from '../../../lib/api';
import {
  FILTRI_USCITE,
  modificaUscita,
  uscitePerIlGestore,
  type FiltroUscite,
  type ModificaUscita,
} from '../../../lib/gestore/uscite';
import { soloGestore } from '../../../lib/permessi';

export const prerender = false;

/** Una data vera (il 30 febbraio no): rileggendola deve tornare uguale. */
const dataValida = (v: string) => {
  const data = new Date(v + 'T12:00:00Z');
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === v
  );
};

export const GET: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const parametri = contesto.url.searchParams;
  const richiesto = parametri.get('filtro') ?? 'prossime';
  const filtro = (FILTRI_USCITE as readonly string[]).includes(richiesto)
    ? (richiesto as FiltroUscite)
    : 'prossime';
  const pagina = Math.max(1, Math.min(200, Number(parametri.get('pagina')) || 1));
  return json({ ok: true, ...(await uscitePerIlGestore(filtro, testo(parametri.get('cerca'), 60), pagina)) });
};

export const PATCH: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const dati = await leggiJson(contesto.request);
  const id = testo(dati?.id, 60);
  if (!id) return errore('Uscita non valida.');

  const modifica: ModificaUscita = {};
  if (typeof dati?.visibile === 'boolean') modifica.visibile = dati.visibile;
  if (dati && 'dataLimite' in dati) {
    const data = dati.dataLimite === null ? null : testo(dati.dataLimite, 10);
    if (data !== null && !dataValida(data)) return errore('Data limite non valida (AAAA-MM-GG).');
    modifica.dataLimite = data;
  }
  if (!Object.keys(modifica).length) return errore('Niente da cambiare.');

  const aggiornata = await modificaUscita(id, modifica);
  if (!aggiornata) return errore('Uscita non trovata.', 404);
  return json({ ok: true, uscita: aggiornata });
};

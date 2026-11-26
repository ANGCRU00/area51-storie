/* /api/gestore/serie. Chi può usarla: SOLO il gestore (soloGestore).
   GET ?filtro=da-confermare|per-adulti|confermate|tutte&cerca=&pagina=: le serie con genere, età e proposta AniList.
   PATCH {chiave, nome, generi, adulti}: conferma o corregge genere ed età della serie. */
import type { APIRoute } from 'astro';
import { errore, json, leggiJson, testo } from '../../../lib/api';
import {
  confermaSerie,
  FILTRI_SERIE,
  generiValidi,
  seriePerIlGestore,
  type FiltroSerie,
} from '../../../lib/gestore/serie';
import { soloGestore } from '../../../lib/permessi';

export const prerender = false;

export const GET: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const parametri = contesto.url.searchParams;
  const richiesto = parametri.get('filtro') ?? 'da-confermare';
  const filtro = (FILTRI_SERIE as readonly string[]).includes(richiesto)
    ? (richiesto as FiltroSerie)
    : 'da-confermare';
  const pagina = Math.max(1, Math.min(200, Number(parametri.get('pagina')) || 1));
  return json({ ok: true, ...(await seriePerIlGestore(filtro, testo(parametri.get('cerca'), 60), pagina)) });
};

export const PATCH: APIRoute = async (contesto) => {
  const gestore = await soloGestore(contesto);
  if (gestore instanceof Response) return gestore;
  const dati = await leggiJson(contesto.request);
  const chiave = testo(dati?.chiave, 40);
  const nome = testo(dati?.nome, 120);
  const generi = generiValidi(dati?.generi);
  if (!/^[A-Z0-9]{6,40}$/.test(chiave) || !nome || !generi || typeof dati?.adulti !== 'boolean')
    return errore('Serie, generi o età non validi.');
  const salvata = await confermaSerie(chiave, nome, generi, dati.adulti);
  return json({
    ok: true,
    serie: {
      chiave: salvata.chiave,
      generi: salvata.generi,
      adulti: salvata.adulti,
      confermata: salvata.confermata,
    },
  });
};

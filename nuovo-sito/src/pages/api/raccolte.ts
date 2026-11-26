/* /api/raccolte. Chi può usarla: SOLO clienti con account (soloCliente), e solo per le proprie liste.
   GET: preferiti e serie seguite (le serie con la prossima uscita) e la chiave della foto del profilo.
   POST {preferiti?, serie?}: aggiunge senza doppioni e restituisce le liste aggiornate.
   DELETE {preferito?: codice, serie?: {s, e}}: toglie una voce. */
import type { APIRoute } from 'astro';
import { errore, json, leggiJson } from '../../lib/api';
import { chiaveFotoDi } from '../../lib/foto-profilo';
import { soloCliente } from '../../lib/permessi';
import {
  aggiungiARaccolte,
  elencoDi,
  MASSIMO_PREFERITI,
  MASSIMO_SERIE,
  preferitoValido,
  raccolteDi,
  serieConProssimeUscite,
  serieValida,
  togliPreferito,
  togliSerie,
} from '../../lib/raccolte';

export const prerender = false;

export const GET: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const { preferiti, serie } = await raccolteDi(cliente.id);
  return json({
    ok: true,
    preferiti,
    serie: await serieConProssimeUscite(serie),
    foto: (await chiaveFotoDi(cliente.id)) ?? '',
  });
};

export const POST: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const dati = await leggiJson(contesto.request, 120_000);
  if (!dati) return errore('Richiesta non valida.');

  const raccolte = await aggiungiARaccolte(
    cliente.id,
    elencoDi(dati.preferiti, preferitoValido, MASSIMO_PREFERITI),
    elencoDi(dati.serie, serieValida, MASSIMO_SERIE),
  );
  return json({ ok: true, ...raccolte, foto: (await chiaveFotoDi(cliente.id)) ?? '' });
};

export const DELETE: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const dati = await leggiJson(contesto.request);
  if (!dati) return errore('Richiesta non valida.');

  if (typeof dati.preferito === 'string' && dati.preferito.trim()) {
    await togliPreferito(cliente.id, dati.preferito.trim().slice(0, 60));
  } else {
    const serie = serieValida(dati.serie);
    if (!serie) return errore('Indica il preferito o la serie da togliere.');
    await togliSerie(cliente.id, serie);
  }
  return json({ ok: true, ...(await raccolteDi(cliente.id)) });
};

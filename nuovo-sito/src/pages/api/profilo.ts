/* /api/profilo. Chi può usarla: SOLO clienti con account (soloCliente), e solo sui propri dati.
   PATCH {nome, telefono}: cambia nome e telefono. Email, password e ruolo non si cambiano da qui. */
import type { APIRoute } from 'astro';
import { errore, json, leggiJson, testo } from '../../lib/api';
import { soloCliente } from '../../lib/permessi';
import { aggiornaProfilo, telefonoValido } from '../../lib/profilo';

export const prerender = false;

export const PATCH: APIRoute = async (contesto) => {
  const cliente = await soloCliente(contesto);
  if (cliente instanceof Response) return cliente;
  const dati = await leggiJson(contesto.request);
  if (!dati) return errore('Richiesta non valida.');

  const nome = testo(dati.nome, 60);
  const telefono = testo(dati.telefono, 30);
  if (nome.length < 1) return errore('Scrivi il tuo nome.');
  if (telefono && !telefonoValido(telefono))
    return errore('Il telefono può contenere solo numeri, spazi e il + iniziale (da 6 a 20 cifre).');

  return json({ ok: true, profilo: await aggiornaProfilo(cliente.id, nome, telefono) });
};

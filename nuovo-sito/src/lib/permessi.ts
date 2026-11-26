/* Controllo unico all'ingresso delle interfacce /api (regola del progetto: chiuse per impostazione).
   Uso: const chi = await soloCliente(contesto); if (chi instanceof Response) return chi; */
import type { APIContext } from 'astro';
import { errore } from './api';
import type { UtenteConnesso } from './accesso';

export async function soloCliente(contesto: APIContext): Promise<UtenteConnesso | Response> {
  const utente = contesto.locals.utente;
  if (!utente) return errore('Per continuare accedi al tuo account.', 401);
  return utente;
}

export async function soloGestore(contesto: APIContext): Promise<UtenteConnesso | Response> {
  const utente = contesto.locals.utente;
  if (!utente) return errore('Accesso richiesto.', 401);
  if (utente.ruolo !== 'gestore') return errore('Non hai i permessi per questa operazione.', 403);
  return utente;
}

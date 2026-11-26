/* Tutte le richieste dell'accesso (registrazione, login, uscita, conferma email, nuova password) vanno a Better Auth. */
import type { APIRoute } from 'astro';
import { servizioAccesso } from '../../../lib/accesso';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => servizioAccesso().handler(request);

/* Account dei clienti e del gestore con Better Auth: email e password (scelta di Angelo), email confermata,
   recupero della password. Utenti e sessioni stanno in D1 (tabelle utenti, sessioni, credenziali, verifiche).
   Segreto obbligatorio BETTER_AUTH_SECRET (in locale nel file .dev.vars, online con `wrangler secret put`). */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';
import { credenziali, sessioni, utenti, verifiche } from '../db/schema';
import { componiEmail, inviaEmail } from './email';
import { cancellaFileFoto } from './foto-profilo';

const variabili = env as unknown as { BETTER_AUTH_SECRET?: string; BETTER_AUTH_URL?: string; DB: D1Database };

function creaAccesso() {
  const db = drizzle(variabili.DB);
  return betterAuth({
    secret: variabili.BETTER_AUTH_SECRET,
    baseURL: variabili.BETTER_AUTH_URL,
    basePath: '/api/accesso',
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user: utenti, session: sessioni, account: credenziali, verification: verifiche },
    }),
    user: {
      additionalFields: {
        ruolo: { type: 'string', defaultValue: 'cliente', input: false },
        telefono: { type: 'string', required: false, input: false },
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (utente) => cancellaFileFoto(utente.id, utente.image),
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const { testo, html } = componiEmail(
          'Nuova password',
          [
            `Ciao ${user.name}, hai chiesto di cambiare la password del tuo account Area 51.`,
            "Il link vale un'ora. Se non sei stato tu, ignora questa email.",
          ],
          { testo: 'Scegli la nuova password', indirizzo: url },
        );
        await inviaEmail({ a: user.email, oggetto: 'Area 51 · nuova password', testo, html });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const { testo, html } = componiEmail(
          'Conferma la tua email',
          [
            `Ciao ${user.name}, benvenuto nel sito di Area 51!`,
            'Conferma la tua email per completare la registrazione.',
          ],
          { testo: 'Confermo la mia email', indirizzo: url },
        );
        await inviaEmail({ a: user.email, oggetto: 'Area 51 · conferma la tua email', testo, html });
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, window: 60, max: 30 },
    advanced: { cookiePrefix: 'area51' },
  });
}

let accesso: ReturnType<typeof creaAccesso> | undefined;
export const servizioAccesso = () => (accesso ??= creaAccesso());

export type UtenteConnesso = { id: string; nome: string; email: string; ruolo: 'cliente' | 'gestore' };

export async function utenteDellaRichiesta(intestazioni: Headers): Promise<UtenteConnesso | null> {
  const sessione = await servizioAccesso().api.getSession({ headers: intestazioni });
  if (!sessione) return null;
  const u = sessione.user as typeof sessione.user & { ruolo?: string };
  return { id: u.id, nome: u.name, email: u.email, ruolo: u.ruolo === 'gestore' ? 'gestore' : 'cliente' };
}

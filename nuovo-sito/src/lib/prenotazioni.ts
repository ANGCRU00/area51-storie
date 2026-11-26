/* Prenotazioni delle prossime uscite fatte dai clienti con account. Valgono quando il negozio le conferma. */
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db, prenotazioni, uscite, type Prenotazione } from '../db';
import type { UtenteConnesso } from './accesso';
import { componiEmail, inviaEmail } from './email';
import { dataLunga, oggi } from './prodotti';

export const COPIE_MASSIME = 5;
const STATI_ATTIVI = ['richiesta', 'confermata', 'arrivata'] as const;

export type EsitoPrenotazione =
  { ok: true; prenotazione: Prenotazione } | { ok: false; errore: string; stato: number };

async function uscitaPrenotabile(codice: string) {
  const [uscita] = await db()
    .select()
    .from(uscite)
    .where(
      and(
        eq(uscite.visibile, true),
        or(eq(uscite.ean, codice), eq(uscite.riferimentoEsterno, codice), eq(uscite.id, codice)),
      ),
    )
    .limit(1);
  return uscita && uscita.dataUscita && uscita.dataUscita > oggi() ? uscita : null;
}

async function prenotazioneAttiva(utenteId: string, codice: string) {
  const [esistente] = await db()
    .select({ id: prenotazioni.id })
    .from(prenotazioni)
    .where(
      and(
        eq(prenotazioni.utenteId, utenteId),
        eq(prenotazioni.codiceProdotto, codice),
        inArray(prenotazioni.stato, STATI_ATTIVI),
      ),
    )
    .limit(1);
  return esistente;
}

export async function prenota(
  utente: UtenteConnesso,
  codice: string,
  copie: number,
  origine: string,
): Promise<EsitoPrenotazione> {
  if (!/^[A-Za-z0-9-]{4,40}$/.test(codice)) return { ok: false, errore: 'Titolo non valido.', stato: 400 };
  if (!Number.isInteger(copie) || copie < 1 || copie > COPIE_MASSIME)
    return { ok: false, errore: `Puoi prenotare da 1 a ${COPIE_MASSIME} copie.`, stato: 400 };

  const uscita = await uscitaPrenotabile(codice);
  if (!uscita)
    return {
      ok: false,
      errore: 'Questo titolo non è più prenotabile online: chiedi in negozio.',
      stato: 404,
    };
  if (await prenotazioneAttiva(utente.id, codice)) {
    return { ok: false, errore: 'Hai già prenotato questo titolo: la trovi nel tuo account.', stato: 409 };
  }

  const [nuova] = await db()
    .insert(prenotazioni)
    .values({
      utenteId: utente.id,
      uscitaId: uscita.id,
      codiceProdotto: codice,
      titolo: uscita.titolo,
      copie,
    })
    .returning();

  const { testo, html } = componiEmail(
    'Prenotazione ricevuta',
    [
      `Ciao ${utente.nome}, abbiamo ricevuto la tua prenotazione: ${uscita.titolo} (${copie} ${copie === 1 ? 'copia' : 'copie'}).`,
      uscita.dataUscita ? `Uscita prevista: ${dataLunga(uscita.dataUscita)}.` : '',
      'La prenotazione vale quando la confermiamo. Ritiri e paghi in negozio.',
    ].filter(Boolean),
    { testo: 'Vedi le tue prenotazioni', indirizzo: origine + '/account' },
  );
  await inviaEmail({ a: utente.email, oggetto: 'Area 51 · prenotazione ricevuta', testo, html });

  return { ok: true, prenotazione: nuova };
}

export async function prenotazioniDi(utenteId: string): Promise<Prenotazione[]> {
  return db()
    .select()
    .from(prenotazioni)
    .where(eq(prenotazioni.utenteId, utenteId))
    .orderBy(desc(prenotazioni.creataIl))
    .limit(100);
}

/** Il cliente può annullare solo le proprie prenotazioni ancora da confermare. */
export async function annullaPrenotazione(utenteId: string, id: string): Promise<boolean> {
  const aggiornate = await db()
    .update(prenotazioni)
    .set({ stato: 'annullata', aggiornataIl: new Date().toISOString().slice(0, 19) + 'Z' })
    .where(
      and(eq(prenotazioni.id, id), eq(prenotazioni.utenteId, utenteId), eq(prenotazioni.stato, 'richiesta')),
    )
    .returning({ id: prenotazioni.id });
  return aggiornate.length > 0;
}

/* Prenotazioni dei clienti con account: qualsiasi prodotto visibile sul sito (magazzino, prossime uscite, uscite
   già uscite). Valgono quando il negozio le conferma: per ciò che non è a scaffale il negozio verifica se può averlo. */
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db, prenotazioni, type Prenotazione } from '../db';
import type { UtenteConnesso } from './accesso';
import { avvisaNegozio, componiEmail, inviaEmail } from './email';
import { dataLunga, prodottoPerCodice, type Prodotto } from './prodotti';

export const COPIE_MASSIME = 5;
export const PRENOTAZIONI_APERTE_MASSIME = 30;
const STATI_ATTIVI = ['richiesta', 'confermata', 'arrivata'] as const;

export type EsitoPrenotazione =
  { ok: true; prenotazione: Prenotazione } | { ok: false; errore: string; stato: number };

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

async function quanteAperte(utenteId: string): Promise<number> {
  const [riga] = await db()
    .select({ n: count() })
    .from(prenotazioni)
    .where(and(eq(prenotazioni.utenteId, utenteId), inArray(prenotazioni.stato, STATI_ATTIVI)));
  return riga?.n ?? 0;
}

const RIGA_PER_EMAIL: Record<Prodotto['disponibilita'], (p: Prodotto) => string> = {
  preordine: (p) => (p.dataUscita ? `Uscita prevista: ${dataLunga(p.dataUscita)}.` : ''),
  in_negozio: () => 'Te lo mettiamo da parte.',
  appena_arrivato: () => 'Te lo mettiamo da parte.',
  uscito: () => 'È già uscito: verifichiamo se possiamo averlo e ti confermiamo.',
  esaurito: () => 'Ora è esaurito: verifichiamo se possiamo riordinarlo e ti confermiamo.',
};

export async function prenota(
  utente: UtenteConnesso,
  codice: string,
  copie: number,
  origine: string,
): Promise<EsitoPrenotazione> {
  if (!/^[A-Za-z0-9-]{4,40}$/.test(codice)) return { ok: false, errore: 'Titolo non valido.', stato: 400 };
  if (!Number.isInteger(copie) || copie < 1 || copie > COPIE_MASSIME)
    return { ok: false, errore: `Puoi prenotare da 1 a ${COPIE_MASSIME} copie.`, stato: 400 };

  const prodotto = await prodottoPerCodice(codice);
  if (!prodotto)
    return {
      ok: false,
      errore: 'Questo prodotto non è più sul sito: chiedicelo con il modulo "Non lo trovi?".',
      stato: 404,
    };
  if (await prenotazioneAttiva(utente.id, codice)) {
    return { ok: false, errore: 'Hai già prenotato questo prodotto: lo trovi nel tuo account.', stato: 409 };
  }
  if ((await quanteAperte(utente.id)) >= PRENOTAZIONI_APERTE_MASSIME) {
    return {
      ok: false,
      errore: `Hai già ${PRENOTAZIONI_APERTE_MASSIME} prenotazioni aperte: ritira o annulla qualcosa prima di aggiungerne altre.`,
      stato: 429,
    };
  }

  const [nuova] = await db()
    .insert(prenotazioni)
    .values({
      utenteId: utente.id,
      uscitaId: prodotto.idUscita ?? null,
      codiceProdotto: codice,
      titolo: prodotto.titolo,
      copie,
    })
    .returning();

  const { testo, html } = componiEmail(
    'Prenotazione ricevuta',
    [
      `Ciao ${utente.nome}, abbiamo ricevuto la tua prenotazione: ${prodotto.titolo} (${copie} ${copie === 1 ? 'copia' : 'copie'}).`,
      RIGA_PER_EMAIL[prodotto.disponibilita](prodotto),
      'La prenotazione vale quando la confermiamo. Ritiri e paghi in negozio.',
    ].filter(Boolean),
    { testo: 'Vedi le tue prenotazioni', indirizzo: origine + '/account' },
  );
  await inviaEmail({ a: utente.email, oggetto: 'Area 51 · prenotazione ricevuta', testo, html });
  await avvisaNegozio(
    'Nuova prenotazione',
    [
      `${utente.nome} (${utente.email}) ha prenotato ${prodotto.titolo}: ${copie} ${copie === 1 ? 'copia' : 'copie'}.`,
    ],
    origine,
  );

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

/* Area gestore: le prenotazioni di tutti i clienti e il cambio di stato. Il cliente riceve un'email quando la sua
   prenotazione viene confermata, è arrivata in negozio o viene annullata dal negozio. */
import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { db, prenotazioni, STATI_PRENOTAZIONE, utenti } from '../../db';
import { componiEmail, inviaEmail } from '../email';

export type StatoPrenotazione = (typeof STATI_PRENOTAZIONE)[number];
export const FILTRI_PRENOTAZIONI = [
  'aperte',
  'richiesta',
  'confermata',
  'arrivata',
  'chiuse',
  'tutte',
] as const;
export type FiltroPrenotazioni = (typeof FILTRI_PRENOTAZIONI)[number];

const PER_FILTRO: Record<FiltroPrenotazioni, StatoPrenotazione[] | null> = {
  aperte: ['richiesta', 'confermata', 'arrivata'],
  richiesta: ['richiesta'],
  confermata: ['confermata'],
  arrivata: ['arrivata'],
  chiuse: ['ritirata', 'annullata'],
  tutte: null,
};

export async function prenotazioniPerIlGestore(filtro: FiltroPrenotazioni) {
  const stati = PER_FILTRO[filtro];
  const condizione: SQL | undefined = stati ? inArray(prenotazioni.stato, stati) : undefined;
  return db()
    .select({
      id: prenotazioni.id,
      titolo: prenotazioni.titolo,
      codiceProdotto: prenotazioni.codiceProdotto,
      copie: prenotazioni.copie,
      stato: prenotazioni.stato,
      creataIl: prenotazioni.creataIl,
      aggiornataIl: prenotazioni.aggiornataIl,
      cliente: utenti.name,
      email: utenti.email,
      telefono: utenti.telefono,
    })
    .from(prenotazioni)
    .innerJoin(utenti, eq(utenti.id, prenotazioni.utenteId))
    .where(condizione)
    .orderBy(desc(prenotazioni.creataIl))
    .limit(300);
}

const MESSAGGIO_AL_CLIENTE: Partial<Record<StatoPrenotazione, { oggetto: string; testo: string }>> = {
  confermata: {
    oggetto: 'prenotazione confermata',
    testo: 'Abbiamo confermato la tua prenotazione: ti avvisiamo quando è pronta da ritirare.',
  },
  arrivata: {
    oggetto: 'la tua prenotazione è arrivata',
    testo: 'È arrivata in negozio: passa a ritirarla negli orari di apertura. Paghi al ritiro.',
  },
  annullata: {
    oggetto: 'prenotazione annullata',
    testo:
      'Purtroppo non riusciamo ad avere questo titolo e abbiamo annullato la prenotazione. Per altro chiamaci allo 0883 884567.',
  },
};

export async function cambiaStatoPrenotazione(id: string, stato: StatoPrenotazione, origine: string) {
  const [aggiornata] = await db()
    .update(prenotazioni)
    .set({ stato, aggiornataIl: new Date().toISOString().slice(0, 19) + 'Z' })
    .where(and(eq(prenotazioni.id, id)))
    .returning();
  if (!aggiornata) return null;

  const messaggio = MESSAGGIO_AL_CLIENTE[stato];
  if (messaggio) {
    const [cliente] = await db()
      .select({ nome: utenti.name, email: utenti.email })
      .from(utenti)
      .where(eq(utenti.id, aggiornata.utenteId))
      .limit(1);
    if (cliente) {
      const { testo, html } = componiEmail(
        messaggio.oggetto.charAt(0).toUpperCase() + messaggio.oggetto.slice(1),
        [
          `Ciao ${cliente.nome},`,
          `${aggiornata.titolo} (${aggiornata.copie} ${aggiornata.copie === 1 ? 'copia' : 'copie'}).`,
          messaggio.testo,
        ],
        { testo: 'Vedi le tue prenotazioni', indirizzo: origine + '/account#prenotazioni' },
      );
      await inviaEmail({ a: cliente.email, oggetto: 'Area 51 · ' + messaggio.oggetto, testo, html });
    }
  }
  return aggiornata;
}

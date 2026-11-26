/* Tabelle del database D1, descritte con Drizzle. È l'unica fonte: le migrazioni in migrazioni/ si generano da qui
   con `npm run db:genera`, e il codice del sito usa questi tipi per leggere e scrivere.
   Date come testo ISO (YYYY-MM-DD per i giorni, YYYY-MM-DDTHH:MM:SSZ per gli istanti), sì/no come 0/1. */
import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const adesso = sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`;
const idCasuale = () => crypto.randomUUID();

/* Prossime uscite da prenotare. Da Starshop (sincronizzazione notturna, fase 6) o inserite a mano dal gestore.
   `visibile` e `data_limite` li decide il gestore: la sincronizzazione non li tocca. */
export const uscite = sqliteTable(
  'uscite',
  {
    id: text('id').primaryKey().$defaultFn(idCasuale),
    /** codice articolo Starshop (unico); null per le uscite inserite a mano */
    riferimentoEsterno: text('riferimento_esterno').unique(),
    ean: text('ean'),
    titolo: text('titolo').notNull(),
    serie: text('serie'),
    numero: text('numero'),
    editore: text('editore'),
    /** dati di fatto da Starshop (riempiti dalla sincronizzazione) */
    autore: text('autore'),
    pagine: integer('pagine'),
    lingua: text('lingua'),
    /** codice della serie su Starshop (codice articolo senza il numero finale) */
    codicePadre: text('codice_padre'),
    /** prezzo di copertina, mai prezzi B2B */
    prezzo: real('prezzo'),
    dataUscita: text('data_uscita'),
    /** ultimo giorno per prenotare; null = da confermare */
    dataLimite: text('data_limite'),
    /** chiave del file in R2 (es. "copertine/00001DCNE0075.jpg"); '' = nessuna copertina disponibile; null = da scaricare */
    copertina: text('copertina'),
    categoria: text('categoria', { enum: ['manga', 'fumetti', 'tcg', 'giochi'] }),
    fonte: text('fonte', { enum: ['starshop', 'manuale'] })
      .notNull()
      .default('manuale'),
    visibile: integer('visibile', { mode: 'boolean' }).notNull().default(true),
    creatoIl: text('creato_il').notNull().default(adesso),
    aggiornatoIl: text('aggiornato_il').notNull().default(adesso),
  },
  (t) => [
    index('uscite_data').on(t.dataUscita),
    index('uscite_categoria').on(t.categoria),
    index('uscite_editore').on(t.editore),
    index('uscite_serie').on(t.codicePadre),
    check(
      'uscite_categoria_valida',
      sql`${t.categoria} IS NULL OR ${t.categoria} IN ('manga', 'fumetti', 'tcg', 'giochi')`,
    ),
  ],
);

/* Magazzino: articoli scansionati dal gestore (pistola barcode) e letti da Starshop, o creati a mano.
   Stati al posto delle quantità: annunciato → appena_arrivato → disponibile → esaurito; da_verificare se non confermato. */
export const STATI_ARTICOLO = [
  'annunciato',
  'appena_arrivato',
  'disponibile',
  'esaurito',
  'da_verificare',
] as const;
export const articoli = sqliteTable(
  'articoli',
  {
    id: text('id').primaryKey().$defaultFn(idCasuale),
    /** codice articolo Starshop, oppure "MAN-<codice>" per gli articoli creati a mano */
    codiceStarshop: text('codice_starshop').notNull().unique(),
    ean: text('ean'),
    /** altri codici a barre dello stesso articolo, come elenco JSON */
    eanAlt: text('ean_alt', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    titolo: text('titolo').notNull(),
    autore: text('autore'),
    editore: text('editore'),
    codiceEditore: text('codice_editore'),
    codicePadre: text('codice_padre'),
    numero: integer('numero'),
    /** prezzo di copertina, mai prezzi B2B */
    prezzoListino: real('prezzo_listino'),
    lingua: text('lingua'),
    pagine: integer('pagine'),
    dataUscita: text('data_uscita'),
    categoria: text('categoria'),
    sottoCategoria: text('sotto_categoria'),
    /** chiave del file in R2, come per le uscite */
    copertina: text('copertina'),
    stato: text('stato', { enum: STATI_ARTICOLO }).notNull().default('annunciato'),
    dataArrivo: text('data_arrivo'),
    esauritoFornitore: integer('esaurito_fornitore', { mode: 'boolean' }),
    visibile: integer('visibile', { mode: 'boolean' }).notNull().default(false),
    fonte: text('fonte', { enum: ['starshop', 'manuale'] })
      .notNull()
      .default('starshop'),
    creatoIl: text('creato_il').notNull().default(adesso),
    aggiornatoIl: text('aggiornato_il').notNull().default(adesso),
  },
  (t) => [
    index('articoli_ean').on(t.ean),
    index('articoli_stato').on(t.stato),
    check(
      'articoli_stato_valido',
      sql`${t.stato} IN ('annunciato', 'appena_arrivato', 'disponibile', 'esaurito', 'da_verificare')`,
    ),
  ],
);

/* Richieste "Chiedicelo" dalla pagina /negozio. Le legge solo il gestore (fase 7). */
export const STATI_RICHIESTA = ['nuova', 'in_lavorazione', 'evasa', 'non_disponibile'] as const;
export const richieste = sqliteTable(
  'richieste',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cosa: text('cosa').notNull(),
    categoria: text('categoria'),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    telefono: text('telefono'),
    stato: text('stato', { enum: STATI_RICHIESTA }).notNull().default('nuova'),
    creataIl: text('creata_il').notNull().default(adesso),
  },
  (t) => [
    index('richieste_stato').on(t.stato, t.creataIl),
    index('richieste_email').on(t.email, t.creataIl),
    check(
      'richieste_lunghezze',
      sql`length(${t.cosa}) BETWEEN 3 AND 300 AND length(${t.nome}) BETWEEN 1 AND 40 AND length(${t.email}) BETWEEN 5 AND 80`,
    ),
  ],
);

/* Serie: genere ed età, uguali per tutti i volumi (chiave = codice padre Starshop, es. "00001DCNE").
   Starshop non li fornisce: per i manga si propongono da AniList (scripts/generi-anilist.mjs), poi il gestore conferma o corregge.
   `adulti` = contenuti per maggiorenni: nascosti negli elenchi finché il visitatore non li attiva. */
export const GENERI = [
  'shonen',
  'shojo',
  'seinen',
  'josei',
  'fantasy',
  'fantascienza',
  'horror',
  'giallo',
  'sportivo',
  'commedia',
  'avventura',
  'slice',
  'romance',
  'azione',
] as const;
export const serie = sqliteTable(
  'serie',
  {
    chiave: text('chiave').primaryKey(),
    nome: text('nome').notNull(),
    /** generi del sito (vedi GENERI), come elenco JSON */
    generi: text('generi', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    adulti: integer('adulti', { mode: 'boolean' }).notNull().default(false),
    fonte: text('fonte', { enum: ['anilist', 'gestore', 'nessuna'] })
      .notNull()
      .default('nessuna'),
    /** dati della proposta AniList, per il controllo del gestore */
    anilistId: integer('anilist_id'),
    anilistTitolo: text('anilist_titolo'),
    anilistGeneri: text('anilist_generi', { mode: 'json' }).$type<string[]>(),
    somiglianza: real('somiglianza'),
    /** vero quando il gestore ha controllato (o scritto) genere ed età */
    confermata: integer('confermata', { mode: 'boolean' }).notNull().default(false),
    aggiornataIl: text('aggiornata_il').notNull().default(adesso),
  },
  (t) => [index('serie_adulti').on(t.adulti)],
);
export type Serie = typeof serie.$inferSelect;

export type Uscita = typeof uscite.$inferSelect;
export type Articolo = typeof articoli.$inferSelect;
export type Richiesta = typeof richieste.$inferSelect;

/* ---------- Account (Better Auth) ----------
   I nomi delle proprietà (name, emailVerified, userId…) sono quelli che Better Auth si aspetta;
   tabelle e colonne nel database hanno nomi italiani. */
const istante = (nome: string) => integer(nome, { mode: 'timestamp_ms' });
export const RUOLI = ['cliente', 'gestore'] as const;

export const utenti = sqliteTable('utenti', {
  id: text('id').primaryKey(),
  name: text('nome').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verificata', { mode: 'boolean' }).notNull().default(false),
  image: text('immagine'),
  ruolo: text('ruolo', { enum: RUOLI }).notNull().default('cliente'),
  telefono: text('telefono'),
  createdAt: istante('creato_il').notNull(),
  updatedAt: istante('aggiornato_il').notNull(),
});

export const sessioni = sqliteTable(
  'sessioni',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('utente_id')
      .notNull()
      .references(() => utenti.id, { onDelete: 'cascade' }),
    expiresAt: istante('scade_il').notNull(),
    ipAddress: text('indirizzo_ip'),
    userAgent: text('browser'),
    createdAt: istante('creata_il').notNull(),
    updatedAt: istante('aggiornata_il').notNull(),
  },
  (t) => [index('sessioni_utente').on(t.userId)],
);

export const credenziali = sqliteTable(
  'credenziali',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('fornitore').notNull(),
    userId: text('utente_id')
      .notNull()
      .references(() => utenti.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: istante('access_token_scade_il'),
    refreshTokenExpiresAt: istante('refresh_token_scade_il'),
    scope: text('scope'),
    password: text('password'),
    createdAt: istante('creata_il').notNull(),
    updatedAt: istante('aggiornata_il').notNull(),
  },
  (t) => [index('credenziali_utente').on(t.userId)],
);

export const verifiche = sqliteTable(
  'verifiche',
  {
    id: text('id').primaryKey(),
    identifier: text('identificativo').notNull(),
    value: text('valore').notNull(),
    expiresAt: istante('scade_il').notNull(),
    createdAt: istante('creata_il').notNull(),
    updatedAt: istante('aggiornata_il').notNull(),
  },
  (t) => [index('verifiche_identificativo').on(t.identifier)],
);

/* Prenotazioni delle prossime uscite, fatte da clienti con account. Valgono quando il negozio le conferma. */
export const STATI_PRENOTAZIONE = ['richiesta', 'confermata', 'arrivata', 'ritirata', 'annullata'] as const;
export const prenotazioni = sqliteTable(
  'prenotazioni',
  {
    id: text('id').primaryKey().$defaultFn(idCasuale),
    utenteId: text('utente_id')
      .notNull()
      .references(() => utenti.id, { onDelete: 'cascade' }),
    uscitaId: text('uscita_id').references(() => uscite.id, { onDelete: 'set null' }),
    codiceProdotto: text('codice_prodotto').notNull(),
    titolo: text('titolo').notNull(),
    copie: integer('copie').notNull().default(1),
    stato: text('stato', { enum: STATI_PRENOTAZIONE }).notNull().default('richiesta'),
    notaCliente: text('nota_cliente'),
    creataIl: text('creata_il').notNull().default(adesso),
    aggiornataIl: text('aggiornata_il').notNull().default(adesso),
  },
  (t) => [
    index('prenotazioni_utente').on(t.utenteId, t.creataIl),
    index('prenotazioni_stato').on(t.stato),
    check('prenotazioni_copie', sql`${t.copie} BETWEEN 1 AND 5`),
  ],
);

export type Utente = typeof utenti.$inferSelect;
export type Prenotazione = typeof prenotazioni.$inferSelect;

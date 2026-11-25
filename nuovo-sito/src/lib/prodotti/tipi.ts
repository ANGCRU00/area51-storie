import { GENERI } from '../../db';

export { GENERI };

export const CATEGORIE = ['manga', 'fumetti', 'tcg', 'giochi', 'figure', 'gadget'] as const;
export type Categoria = (typeof CATEGORIE)[number];
export type CategoriaUscita = 'manga' | 'fumetti' | 'tcg' | 'giochi';

export const NOME_CATEGORIA: Record<Categoria, string> = {
  manga: 'Manga',
  fumetti: 'Fumetti',
  tcg: 'TCG',
  giochi: 'Giochi da tavolo e di ruolo',
  figure: 'Figure e Funko',
  gadget: 'Gadget',
};

export const NOME_GENERE: Record<string, string> = {
  shonen: 'Shōnen',
  shojo: 'Shōjo',
  seinen: 'Seinen',
  josei: 'Josei',
  fantasy: 'Fantasy',
  fantascienza: 'Fantascienza',
  horror: 'Horror',
  giallo: 'Giallo',
  sportivo: 'Sportivo',
  commedia: 'Commedia',
  avventura: 'Avventura',
  slice: 'Slice of life',
  romance: 'Romance',
  azione: 'Azione',
};

export type Disponibilita = 'in_negozio' | 'appena_arrivato' | 'esaurito' | 'preordine' | 'uscito';

export const TESTO_DISPONIBILITA: Record<Disponibilita, string> = {
  in_negozio: 'Disponibile in negozio',
  appena_arrivato: 'Appena arrivato',
  esaurito: 'Esaurito, ordinabile',
  preordine: 'Prenotabile',
  uscito: 'Uscito: chiedi in negozio',
};

export const COOKIE_ETA_CONFERMATA = 'area51_adulti';

export type Prodotto = {
  /** usato nell'indirizzo /prodotto/<codice>: EAN se c'è, altrimenti codice Starshop */
  codice: string;
  tipo: 'magazzino' | 'uscita';
  idUscita?: string;
  ean: string | null;
  titolo: string;
  serie: string;
  volume: string | null;
  edizione: string | null;
  autore: string | null;
  editore: string | null;
  numero: string | null;
  prezzo: number | null;
  dataUscita: string | null;
  dataLimite: string | null;
  categoria: Categoria | null;
  copertina: string | null;
  disponibilita: Disponibilita;
  pagine: number | null;
  lingua: string | null;
  codiceSerie: string | null;
  generi: string[];
  perAdulti: boolean;
};

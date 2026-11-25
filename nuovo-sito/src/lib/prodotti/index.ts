/* Prodotti del sito, letti da D1: articoli del magazzino (scansionati dal gestore) e prossime uscite (Starshop o a mano). */
export * from './tipi';
export * from './formati';
export { categoriaDaStarshop, daArticolo, daUscita, urlCopertina } from './conversione';
export {
  cercaProdotti,
  filtriDaIndirizzo,
  type Filtri,
  type FiltriDellaPagina,
  type Ordine,
  type Risultato,
  type Stato,
} from './catalogo';
export { trovaProdotto, type SchedaProdotto } from './scheda';
export { perLaHome } from './home';
export { filtriScelti, indirizzoConFiltri, vedeSoloAdulti, type FiltroScelto } from './indirizzi';
export {
  dettagliDi,
  eLibro,
  repartoDi,
  siCompra,
  siPrenota,
  tutteLeEdizioni,
  type Reparto,
} from './presentazione';

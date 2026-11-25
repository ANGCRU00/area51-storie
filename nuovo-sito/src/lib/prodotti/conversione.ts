import type { Articolo, Uscita } from '../../db';
import { oggi } from './formati';
import { autoreLeggibile, edizione, serieEVolume } from './titoli';
import type { Categoria, Disponibilita, Prodotto } from './tipi';

const SOTTOCATEGORIE_FUMETTI = [
  'FUMETTO U.S.A.',
  'FUMETTO ITALIANO',
  'FUMETTO FRANCO-BELGA',
  'FUMETTO SPAGNOLO',
  'ILLUSTRAZIONE',
];

/** Stessa regola della sincronizzazione Starshop (privato/starshop-edge-function.ts, categoriaUscita). */
export function categoriaDaStarshop(
  categoria: string | null,
  sottocategoria: string | null,
): Categoria | null {
  const cat = (categoria ?? '').trim().toUpperCase();
  const sotto = (sottocategoria ?? '').trim().toUpperCase();

  if (cat === 'PUBBLICAZIONI') {
    if (sotto === 'FUMETTO MANGA') return 'manga';
    if (SOTTOCATEGORIE_FUMETTI.includes(sotto) || sotto.startsWith('FUMETTO D')) return 'fumetti';
    return null;
  }
  if (sotto === 'GIOCHI DI CARTE' && (cat === 'GIOCHI' || cat === 'GADGET')) return 'tcg';
  if (cat === 'GIOCHI' && (sotto === 'GIOCHI DA TAVOLO' || sotto === 'GIOCHI DI RUOLO')) return 'giochi';
  return null;
}

export const urlCopertina = (chiaveFile: string | null) => (chiaveFile ? '/file/' + chiaveFile : null);

const codiceSerieDaRiferimento = (riferimento: string | null) =>
  riferimento ? riferimento.replace(/\d{4}$/, '') : null;

function disponibilitaArticolo(stato: Articolo['stato']): Disponibilita {
  switch (stato) {
    case 'esaurito':
      return 'esaurito';
    case 'appena_arrivato':
      return 'appena_arrivato';
    case 'annunciato':
      return 'preordine';
    default:
      return 'in_negozio';
  }
}

export function daArticolo(articolo: Articolo): Prodotto {
  const categoria = categoriaDaStarshop(articolo.categoria, articolo.sottoCategoria);
  const numero = articolo.numero == null ? null : String(articolo.numero);
  return {
    codice: articolo.ean || articolo.codiceStarshop,
    tipo: 'magazzino',
    ean: articolo.ean,
    titolo: articolo.titolo,
    ...serieEVolume(articolo.titolo, numero, categoria),
    edizione: edizione(articolo.titolo, categoria),
    autore: autoreLeggibile(articolo.autore),
    editore: articolo.editore,
    numero,
    prezzo: articolo.prezzoListino,
    dataUscita: articolo.dataUscita,
    dataLimite: null,
    categoria,
    copertina: urlCopertina(articolo.copertina),
    disponibilita: disponibilitaArticolo(articolo.stato),
    pagine: articolo.pagine,
    lingua: articolo.lingua,
    codiceSerie: articolo.codicePadre,
    generi: [],
    perAdulti: false,
  };
}

export function daUscita(uscita: Uscita): Prodotto {
  const giaUscita = !!uscita.dataUscita && uscita.dataUscita <= oggi();
  return {
    codice: uscita.ean || uscita.riferimentoEsterno || uscita.id,
    tipo: 'uscita',
    idUscita: uscita.id,
    ean: uscita.ean,
    titolo: uscita.titolo,
    ...serieEVolume(uscita.titolo, uscita.numero, uscita.categoria),
    edizione: edizione(uscita.titolo, uscita.categoria),
    autore: autoreLeggibile(uscita.autore),
    editore: uscita.editore,
    numero: uscita.numero,
    prezzo: uscita.prezzo,
    dataUscita: uscita.dataUscita,
    dataLimite: uscita.dataLimite,
    categoria: uscita.categoria,
    copertina: urlCopertina(uscita.copertina),
    disponibilita: giaUscita ? 'uscito' : 'preordine',
    pagine: uscita.pagine,
    lingua: uscita.lingua,
    codiceSerie: uscita.codicePadre ?? codiceSerieDaRiferimento(uscita.riferimentoEsterno),
    generi: [],
    perAdulti: false,
  };
}

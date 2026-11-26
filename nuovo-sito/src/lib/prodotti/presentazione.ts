import { dataLunga } from './formati';
import { NOME_CATEGORIA, NOME_GENERE, type Categoria, type Prodotto } from './tipi';

export type Reparto = { testo: string; href: string };

const REPARTI: Partial<Record<Categoria, Reparto>> = {
  tcg: { testo: 'TCG', href: '/tcg' },
  giochi: { testo: 'Giochi da tavolo', href: '/giochi' },
  figure: { testo: 'Figure & Funko', href: '/figure' },
  gadget: { testo: 'Gadget', href: '/gadget' },
};
const MANGA_E_FUMETTI: Reparto = { testo: 'Manga & Fumetti', href: '/catalogo' };

export const repartoDi = (prodotto: Prodotto): Reparto =>
  (prodotto.categoria && REPARTI[prodotto.categoria]) || MANGA_E_FUMETTI;

export const siPrenota = (prodotto: Prodotto) => prodotto.disponibilita === 'preordine';

export const eLibro = (prodotto: Prodotto) =>
  prodotto.categoria === 'manga' || prodotto.categoria === 'fumetti';

const maiuscolaIniziale = (testo: string) => testo.charAt(0) + testo.slice(1).toLowerCase();

/** Le voci del riquadro dei dati, nell'ordine in cui si mostrano; quelle senza valore non compaiono. */
export function dettagliDi(prodotto: Prodotto): { nome: string; valore: string }[] {
  const voci: [string, string | null][] = [
    ['Editore', prodotto.editore],
    ['Autore', prodotto.autore],
    ['Data di uscita', prodotto.dataUscita && dataLunga(prodotto.dataUscita)],
    ['Genere', prodotto.generi.map((g) => NOME_GENERE[g] ?? g).join(', ') || null],
    ['Edizione', prodotto.edizione],
    ['Pagine', prodotto.pagine ? String(prodotto.pagine) : null],
    ['Lingua', prodotto.lingua && maiuscolaIniziale(prodotto.lingua)],
    ['Tipo', prodotto.categoria && NOME_CATEGORIA[prodotto.categoria]],
    ['EAN', prodotto.ean],
  ];
  return voci.filter((v): v is [string, string] => !!v[1]).map(([nome, valore]) => ({ nome, valore }));
}

/** Il volume attuale e le sue altre edizioni, la Standard per prima. */
export function tutteLeEdizioni(prodotto: Prodotto, altreEdizioni: Prodotto[]): Prodotto[] {
  if (!altreEdizioni.length) return [];
  const standardPrima = (a: Prodotto, b: Prodotto) =>
    Number(b.edizione === 'Standard') - Number(a.edizione === 'Standard');
  return [prodotto, ...altreEdizioni].sort(standardPrima);
}

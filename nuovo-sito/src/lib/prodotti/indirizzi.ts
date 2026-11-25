import type { FiltriDellaPagina } from './catalogo';
import { nomeMese } from './formati';
import { NOME_CATEGORIA, NOME_GENERE, type Categoria } from './tipi';

type Valore = string | number | string[] | undefined;
type Modifiche = Partial<
  Record<'cerca' | 'cat' | 'stato' | 'editore' | 'genere' | 'adulti' | 'mese' | 'ordine' | 'pagina', Valore>
>;

export type FiltroScelto = { testo: string; indirizzo: string };

export const vedeSoloAdulti = (filtri: FiltriDellaPagina) => !!filtri.soloAdulti && !!filtri.etaConfermata;

function valoriAttuali(filtri: FiltriDellaPagina): Record<string, Valore> {
  return {
    cerca: filtri.cerca,
    cat: filtri.cat,
    stato: filtri.stato === 'tutti' ? '' : filtri.stato,
    editore: filtri.editori ?? [],
    genere: filtri.generi ?? [],
    adulti: vedeSoloAdulti(filtri) ? '1' : '',
    mese: filtri.mese,
    ordine: filtri.ordine === 'recenti' ? '' : filtri.ordine,
  };
}

/** Indirizzo della stessa pagina con i filtri attuali, cambiando solo quelli indicati. */
export function indirizzoConFiltri(
  percorso: string,
  filtri: FiltriDellaPagina,
  modifiche: Modifiche = {},
): string {
  const parametri = new URLSearchParams();
  for (const [nome, valore] of Object.entries({ ...valoriAttuali(filtri), ...modifiche })) {
    if (Array.isArray(valore)) valore.forEach((v) => parametri.append(nome, v));
    else if (valore !== undefined && valore !== '' && !(nome === 'pagina' && valore === 1))
      parametri.set(nome, String(valore));
  }
  const testo = parametri.toString();
  return percorso + (testo ? '?' + testo : '');
}

/** Le etichette dei filtri scelti, ognuna con l'indirizzo che la toglie. */
export function filtriScelti(
  percorso: string,
  filtri: FiltriDellaPagina,
  categorie: Categoria[],
  statoSceglibile = true,
): FiltroScelto[] {
  const senza = (modifiche: Modifiche) => indirizzoConFiltri(percorso, filtri, modifiche);
  const generi = filtri.generi ?? [];
  const editori = filtri.editori ?? [];
  const scelti: (FiltroScelto | false | undefined | '')[] = [
    filtri.cerca && { testo: `«${filtri.cerca}»`, indirizzo: senza({ cerca: '' }) },
    filtri.cat &&
      categorie.length > 1 && { testo: NOME_CATEGORIA[filtri.cat], indirizzo: senza({ cat: '' }) },
    vedeSoloAdulti(filtri) && { testo: 'Solo 18+', indirizzo: senza({ adulti: '' }) },
    statoSceglibile && filtri.stato === 'negozio' && { testo: 'In negozio', indirizzo: senza({ stato: '' }) },
    statoSceglibile &&
      filtri.stato === 'preordini' && { testo: 'Preordini', indirizzo: senza({ stato: '' }) },
    ...generi.map((g) => ({
      testo: NOME_GENERE[g] ?? g,
      indirizzo: senza({ genere: generi.filter((x) => x !== g) }),
    })),
    ...editori.map((e) => ({ testo: e, indirizzo: senza({ editore: editori.filter((x) => x !== e) }) })),
    filtri.mese && { testo: nomeMese(filtri.mese), indirizzo: senza({ mese: '' }) },
  ];
  return scelti.filter((s): s is FiltroScelto => !!s);
}

import type { Categoria } from './tipi';

type SerieEVolume = { serie: string; volume: string | null };

const SEGNO_EDIZIONE_FINALE =
  /\s+(NEW\.?\s?ED\.?|N\.\s?ED\.?|NUOVA\s+EDIZIONE|NEW\s+EDITION|ED\.?\s+DELUXE|DELUXE|VARIANT|VRT|LIMITED|LTD)\s*$/i;

const NUMERO_FINALE = /^(.*?)(?:\s+(?:N\.?|NO\.?|VOL\.?|#)\s*|\s+|\s*[.#-]\s*)(\d{1,4})\s*$/i;

const NUOVA_EDIZIONE = /(\bNEW\.?\s?ED\b|\bN\.\s?ED\b|NUOVA\s+EDIZIONE|NEW\s+EDITION)/;
const VARIANT = /\b(VARIANT|VRT|VAR)\b/;
const DELUXE = /\bDELUXE\b/;
const LIMITED = /\b(LIMITED|LTD|LIMITATA)\b/;
const SPECIALE = /\b(COLLECTOR|SPECIAL|SPECIALE)\b/;

const AUTORI_VARI = /^AA\.?\s?VV\.?$/i;

const eLibro = (categoria: Categoria | null) => categoria === 'manga' || categoria === 'fumetti';

function togliSegniDiEdizione(titolo: string): string {
  let pulito = titolo.trim();
  while (SEGNO_EDIZIONE_FINALE.test(pulito)) {
    pulito = pulito
      .replace(SEGNO_EDIZIONE_FINALE, '')
      .replace(/\s*-\s*$/, '')
      .trim();
  }
  return pulito;
}

/** "BLUE BOX 17" → serie "BLUE BOX", volume "17". Il numero deve comparire nel titolo e coincidere con quello di Starshop. */
function separaSerieEVolume(titolo: string, numeroStarshop: string | null): SerieEVolume {
  const senzaEdizione = togliSegniDiEdizione(titolo);
  const trovato = senzaEdizione.match(NUMERO_FINALE);
  if (!trovato) return { serie: senzaEdizione, volume: null };

  const [, serie, numero] = trovato;
  const serieValida = serie.trim().length >= 2;
  const numeroCoincide = !numeroStarshop || Number(numero) === Number(numeroStarshop);
  if (!serieValida || !numeroCoincide) return { serie: senzaEdizione, volume: null };

  return { serie: serie.trim(), volume: String(Number(numero)) };
}

export function serieEVolume(
  titolo: string,
  numero: string | null,
  categoria: Categoria | null,
): SerieEVolume {
  if (!eLibro(categoria)) return { serie: titolo, volume: null };
  return separaSerieEVolume(titolo, numero);
}

export function edizione(titolo: string, categoria: Categoria | null): string | null {
  if (!eLibro(categoria)) return null;
  const t = titolo.toUpperCase();
  const nuova = NUOVA_EDIZIONE.test(t);
  if (VARIANT.test(t)) return nuova ? 'Nuova edizione, Variant' : 'Variant';
  if (nuova) return 'Nuova edizione';
  if (DELUXE.test(t)) return 'Deluxe';
  if (LIMITED.test(t)) return 'Limited';
  if (SPECIALE.test(t)) return 'Speciale';
  return 'Standard';
}

export function autoreLeggibile(autore: string | null): string | null {
  if (autore && AUTORI_VARI.test(autore.trim())) return 'Autori vari';
  return autore;
}

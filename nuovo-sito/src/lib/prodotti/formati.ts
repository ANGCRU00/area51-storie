import type { Prodotto } from './tipi';

const MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

const GIORNO_IN_MS = 864e5;

export const oggi = () => new Date().toISOString().slice(0, 10);

export const giorniFa = (giorni: number) =>
  new Date(Date.now() - giorni * GIORNO_IN_MS).toISOString().slice(0, 10);

export function euro(prezzo: number | null): string {
  if (prezzo == null) return 'Prezzo da confermare';
  return prezzo.toFixed(2).replace('.', ',') + ' €';
}

export function dataLunga(dataIso: string): string {
  const data = new Date(dataIso + 'T12:00:00');
  return `${data.getDate()} ${MESI[data.getMonth()]} ${data.getFullYear()}`;
}

export function nomeMese(annoMese: string): string {
  const [anno, mese] = annoMese.split('-');
  const nome = MESI[Number(mese) - 1];
  return nome.charAt(0).toUpperCase() + nome.slice(1) + ' ' + anno;
}

export function quandoEsce(prodotto: Prodotto): string {
  if (!prodotto.dataUscita) return '';
  const giaUscito = prodotto.dataUscita <= oggi();
  return (giaUscito ? 'Uscito il ' : 'Esce il ') + dataLunga(prodotto.dataUscita);
}

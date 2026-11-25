/* Orari del negozio: un solo punto da cambiare per tutto il sito (stato in testata della home, tabella in /negozio, piede).
   Indice = giorno della settimana come in JavaScript: 0 domenica (chiuso), 1 lunedì (solo sera), 2 martedì … 6 sabato. */
export type Fascia = [string, string];
const MATTINA_SERA: Fascia[] = [['09:30', '13:00'], ['17:00', '20:30']];
export const ORARI: (Fascia[] | null)[] = [null, [['17:00', '20:30']], MATTINA_SERA, MATTINA_SERA, MATTINA_SERA, MATTINA_SERA, MATTINA_SERA];
export const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
/** Ordine di lettura di un calendario: da lunedì a domenica */
export const SETTIMANA = [1, 2, 3, 4, 5, 6, 0];

const minuti = (h: string) => { const p = h.split(':'); return Number(p[0]) * 60 + Number(p[1]); };
/** "09:30" → "9:30", "17:00" → "17" */
export const breve = (h: string) => { const p = h.split(':'); return String(Number(p[0])) + (p[1] === '00' ? '' : ':' + p[1]); };
export const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Fasce di un giorno per esteso: "09:30–13:00 · 17:00–20:30" oppure "Chiuso" */
export const fasceEstese = (g: number) => ORARI[g]?.map((f) => f[0] + '–' + f[1]).join(' · ') ?? 'Chiuso';
/** Fasce di un giorno in breve: "9:30–13 e 17–20:30" oppure "chiuso" */
export const fasceBrevi = (g: number) => ORARI[g]?.map((f) => breve(f[0]) + '–' + breve(f[1])).join(' e ') ?? 'chiuso';

/** Aperto o chiuso adesso, e quando cambia */
export function statoNegozio(adesso = new Date()): { aperto: boolean; testo: string } {
  const g = adesso.getDay(), m = adesso.getHours() * 60 + adesso.getMinutes(), oggi = ORARI[g] ?? [];
  for (const f of oggi) if (m >= minuti(f[0]) && m < minuti(f[1])) return { aperto: true, testo: 'Aperto ora, chiude alle ' + breve(f[1]) };
  for (const f of oggi) if (m < minuti(f[0])) return { aperto: false, testo: 'Chiuso, riapre oggi alle ' + breve(f[0]) };
  for (let k = 1; k <= 7; k++) {
    const gg = (g + k) % 7, o = ORARI[gg];
    if (o) return { aperto: false, testo: 'Chiuso, riapre ' + (k === 1 ? 'domani' : GIORNI[gg]) + ' alle ' + breve(o[0][0]) };
  }
  return { aperto: false, testo: 'Chiuso' };
}

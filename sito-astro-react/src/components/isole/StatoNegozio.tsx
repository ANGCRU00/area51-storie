/* Isola (React): "Aperto ora / Chiuso, riapre…". Deve girare nel browser perché dipende dall'ora di chi guarda; si aggiorna ogni minuto. */
import { useEffect, useState } from 'react';

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MS = [['09:30', '13:00'], ['17:00', '20:30']];
const ORARI: (string[][] | null)[] = [null, [['17:00', '20:30']], MS, MS, MS, MS, MS];
const minuti = (h: string) => { const p = h.split(':'); return Number(p[0]) * 60 + Number(p[1]); };
const breve = (h: string) => { const p = h.split(':'); return String(Number(p[0])) + (p[1] === '00' ? '' : ':' + p[1]); };
const fasce = (g: number) => ORARI[g] ? ORARI[g]!.map((f) => breve(f[0]) + '–' + breve(f[1])).join(' e ') : 'chiuso';

function stato() {
  const d = new Date(), g = d.getDay(), m = d.getHours() * 60 + d.getMinutes(), oggi = ORARI[g] || [];
  for (const f of oggi) if (m >= minuti(f[0]) && m < minuti(f[1])) return { aperto: true, testo: 'Aperto ora, chiude alle ' + breve(f[1]) };
  for (const f of oggi) if (m < minuti(f[0])) return { aperto: false, testo: 'Chiuso, riapre oggi alle ' + breve(f[0]) };
  for (let k = 1; k <= 7; k++) { const gg = (g + k) % 7; if (ORARI[gg]) return { aperto: false, testo: 'Chiuso, riapre ' + (k === 1 ? 'domani' : GIORNI[gg]) + ' alle ' + breve(ORARI[gg]![0][0]) }; }
  return { aperto: false, testo: 'Chiuso' };
}

export default function StatoNegozio() {
  // prima che parta il JavaScript (e per Google) si vede "Orari e mappa", poi lo stato vero
  const [s, setS] = useState<{ aperto: boolean; testo: string } | null>(null);
  const [sotto, setSotto] = useState('Viale G. Falcone e P. Borsellino, 35, Barletta');
  useEffect(() => {
    const agg = () => { setS(stato()); const g = new Date().getDay(); setSotto(GIORNI[g].charAt(0).toUpperCase() + GIORNI[g].slice(1) + ' ' + fasce(g)); };
    agg();
    const t = setInterval(agg, 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <a href="negozio.html" className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#120a2e]/80 hover:border-brand-lime px-4 py-3 transition-colors">
      <svg className="w-6 h-6 shrink-0 text-brand-lime" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <span className="min-w-0">
        <b className="block font-heavy text-sm sm:text-base text-white">
          {s ? <><span className={'inline-block w-2 h-2 rounded-full mr-2 align-middle ' + (s.aperto ? 'bg-brand-lime' : 'bg-[#FB923C]')} aria-hidden="true" />{s.testo}</> : 'Orari e mappa'}
        </b>
        <span className="block text-xs sm:text-sm font-semibold text-brand-muted">{sotto}</span>
      </span>
    </a>
  );
}

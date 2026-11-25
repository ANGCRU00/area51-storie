/* Isola: "Aperto ora / Chiuso, riapre…". Gira nel browser perché dipende dall'ora di chi guarda; si aggiorna ogni minuto.
   Prima che parta il JavaScript (e per Google) mostra "Orari e mappa" con l'indirizzo. */
import { useEffect, useState } from 'react';
import { GIORNI, fasceBrevi, maiuscola, statoNegozio } from '../../lib/orari';
import css from './Riquadro.module.css';

export default function StatoNegozio() {
  const [s, setS] = useState<{ aperto: boolean; testo: string } | null>(null);
  const [sotto, setSotto] = useState('Viale G. Falcone e P. Borsellino, 35, Barletta');
  useEffect(() => {
    const agg = () => { setS(statoNegozio()); const g = new Date().getDay(); setSotto(maiuscola(GIORNI[g]) + ' ' + fasceBrevi(g)); };
    agg();
    const t = setInterval(agg, 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <a href="/negozio" className={css.riquadro}>
      <svg className={css.icona} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <span className={css.testi}>
        <b className={'pesante ' + css.titolo}>
          {s ? <><span className={css.spia + ' ' + (s.aperto ? css.aperto : css.chiuso)} aria-hidden="true" />{s.testo}</> : 'Orari e mappa'}
        </b>
        <span className={css.sotto}>{sotto}</span>
      </span>
    </a>
  );
}

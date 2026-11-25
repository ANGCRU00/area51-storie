/* Isola: i due pulsanti "Nuovi arrivi / Prossime uscite" e le schede.
   Le schede arrivano già pronte dalla costruzione del sito (props), quindi sono nell'HTML anche senza JavaScript;
   qui c'è solo ciò che risponde ai tocchi: cambio di elenco e "Aggiungi" / "Prenota". */
import { useRef, useState } from 'react';
import { carrello } from '../../lib/negozio';
import css from './NuoviArrivi.module.css';

export type Scheda = { ean: string; titolo: string; editore: string; prezzo: number; quando: string; pre: boolean };

const euro = (x: number) => x.toFixed(2).replace('.', ',') + ' €';

export default function NuoviArrivi({ nuovi, prossime }: { nuovi: Scheda[]; prossime: Scheda[] }) {
  const [tipo, setTipo] = useState<'nuovi' | 'prossime'>('nuovi');
  const [aggiunto, setAggiunto] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const elenco = tipo === 'nuovi' ? nuovi : prossime;

  function aggiungi(s: Scheda) {
    carrello.aggiungi({ k: s.ean, t: s.titolo, p: s.prezzo, l: '/prodotto/' + s.ean, i: '/img/copertine/' + s.ean + '.webp', e: s.editore, d: s.pre ? 'Preordine' : '' });
    setAggiunto(s.ean);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAggiunto(''), 1800);
  }

  return (
    <>
      <div className={css.scelta} role="group" aria-label="Scegli cosa vedere">
        <button type="button" aria-pressed={tipo === 'nuovi'} className={tipo === 'nuovi' ? css.attivo : css.spento} onClick={() => setTipo('nuovi')}>Nuovi arrivi</button>
        <button type="button" aria-pressed={tipo === 'prossime'} className={tipo === 'prossime' ? css.attivo : css.spento} onClick={() => setTipo('prossime')}>Prossime uscite</button>
      </div>
      {elenco.length === 0 && <p className={css.vuoto}>Per ora non ci sono {tipo === 'prossime' ? 'uscite annunciate' : 'novità'} nei cataloghi.</p>}
      <div className={css.griglia}>
        {elenco.map((s) => (
          <article key={tipo + s.ean} className={css.scheda}>
            <a href={'/prodotto/' + s.ean} className={css.collegamento}>
              <div className={css.copertina}>
                <img src={'/img/copertine/' + s.ean + '.webp'} alt={'Copertina di ' + s.titolo} width="220" height="320" loading="lazy" decoding="async" />
                <span className={'pesante ' + css.etichetta + ' ' + (s.pre ? css.etichettaPre : '')}>{s.pre ? 'PREORDINE' : 'NOVITÀ'}</span>
              </div>
              <p className={css.editore}>{s.editore}</p>
              <h3 className={'pesante ' + css.titolo}>{s.titolo}</h3>
              <p className={css.quando}>{s.quando}</p>
            </a>
            <div className={css.piede}>
              <span className={'pesante ' + css.prezzo}>{euro(s.prezzo)}</span>
              <button type="button" onClick={() => aggiungi(s)} className={'pesante ' + (s.pre ? css.prenota : css.aggiungi)}>
                {aggiunto === s.ean ? 'Aggiunto ✓' : s.pre ? 'Prenota' : 'Aggiungi'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

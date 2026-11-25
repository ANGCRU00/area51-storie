/* Isola: il cuore dei preferiti in testata, con il numero di preferiti salvati su questo dispositivo. */
import { useSyncExternalStore } from 'react';
import { ascolta, preferiti } from '../../lib/negozio';
import css from './PulsantePreferiti.module.css';

export default function PulsantePreferiti() {
  const n = useSyncExternalStore(ascolta, preferiti.conta, () => 0);
  return (
    <a href="/profilo#preferiti" className={'tondo ' + css.pulsante} aria-label={'Preferiti' + (n ? ', ' + n : '')}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.3 6.3a4.5 4.5 0 000 6.4L12 20.4l7.7-7.7a4.5 4.5 0 00-6.4-6.4L12 7.6l-1.3-1.3a4.5 4.5 0 00-6.4 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
      {n > 0 && <span className={'pesante ' + css.numero}>{n}</span>}
    </a>
  );
}

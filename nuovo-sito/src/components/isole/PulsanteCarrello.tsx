/* Isola: il pulsante del carrello in testata, con il numero di prodotti. Si aggiorna da solo quando cambia il carrello,
   anche da un'altra scheda del browser. Prima che parta il JavaScript mostra 0. */
import { useSyncExternalStore } from 'react';
import { ascolta, carrello } from '../../lib/negozio';
import css from './PulsanteCarrello.module.css';

export default function PulsanteCarrello() {
  const n = useSyncExternalStore(ascolta, carrello.conta, () => 0);
  return (
    <a
      className={css.pulsante}
      href="/carrello"
      aria-label={`Carrello, ${n} ${n === 1 ? 'prodotto' : 'prodotti'}`}
    >
      <svg className={css.icona} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      </svg>
      <span className={css.esteso}>Carrello · {n}</span>
      <span className={css.breve}>{n}</span>
    </a>
  );
}

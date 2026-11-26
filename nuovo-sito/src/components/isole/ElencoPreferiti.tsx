/* Isola: i preferiti salvati su questo dispositivo (cuore delle schede), con il pulsante per toglierli. */
import { useSyncExternalStore } from 'react';
import { ascolta, preferiti, type Preferito } from '../../lib/negozio';
import css from './ElencoPreferiti.module.css';

const nessuno: Preferito[] = [];
let ultimoTesto = '';
let ultimoElenco: Preferito[] = nessuno;

/** useSyncExternalStore vuole lo stesso oggetto finché i dati non cambiano */
function leggi(): Preferito[] {
  const elenco = preferiti.tutti();
  const testo = JSON.stringify(elenco);
  if (testo !== ultimoTesto) {
    ultimoTesto = testo;
    ultimoElenco = elenco;
  }
  return ultimoElenco;
}

const euro = (prezzo: number) => prezzo.toFixed(2).replace('.', ',') + ' €';

export default function ElencoPreferiti() {
  const elenco = useSyncExternalStore(ascolta, leggi, () => nessuno);

  if (!elenco.length) {
    return (
      <p className={css.vuoto}>
        Nessun preferito per ora: tocca il cuore sulla copertina di un titolo per salvarlo qui.
      </p>
    );
  }
  return (
    <ul className={css.elenco}>
      {elenco.map((p) => (
        <li key={p.k} className={css.voce}>
          {p.i ? (
            <img src={p.i} alt="" width="48" height="72" loading="lazy" />
          ) : (
            <span className={css.senza} aria-hidden="true" />
          )}
          <a href={p.l} className={css.titolo}>
            {p.t}
            {p.e && <span>{p.e}</span>}
          </a>
          <span className={css.prezzo}>{p.p ? euro(p.p) : ''}</span>
          <button
            type="button"
            className={css.togli}
            onClick={() => preferiti.scambia(p)}
            aria-label={'Togli ' + p.t + ' dai preferiti'}
          >
            Togli
          </button>
        </li>
      ))}
    </ul>
  );
}

/* Isola dell'area gestore: le richieste "Chiedicelo". Si risponde per email (o telefono) e si segna lo stato. */
import { useCallback, useEffect, useState } from 'react';
import { chiamaGestore, dataBreve } from '../../../lib/gestore-browser';
import css from './Gestore.module.css';

type Richiesta = {
  id: number;
  cosa: string;
  categoria: string | null;
  nome: string;
  email: string;
  telefono: string | null;
  stato: string;
  creataIl: string;
};

const FILTRI = [
  { valore: 'aperte', testo: 'Aperte' },
  { valore: 'chiuse', testo: 'Chiuse' },
  { valore: 'tutte', testo: 'Tutte' },
];

const STATI = [
  { valore: 'nuova', testo: 'Nuova' },
  { valore: 'in_lavorazione', testo: 'In lavorazione' },
  { valore: 'evasa', testo: 'Trovato' },
  { valore: 'non_disponibile', testo: 'Non disponibile' },
];

const indirizzoRisposta = (r: Richiesta) =>
  `mailto:${r.email}?subject=${encodeURIComponent('Area 51 · la tua richiesta')}&body=${encodeURIComponent(
    `Ciao ${r.nome},\n\nabbiamo letto la tua richiesta: "${r.cosa}".\n\n`,
  )}`;

export default function RichiesteGestore() {
  const [filtro, setFiltro] = useState('aperte');
  const [elenco, setElenco] = useState<Richiesta[] | null>(null);
  const [errore, setErrore] = useState('');

  const carica = useCallback(async () => {
    setErrore('');
    try {
      const dati = await chiamaGestore<{ richieste: Richiesta[] }>('richieste?filtro=' + filtro);
      setElenco(dati.richieste);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [filtro]);

  useEffect(() => {
    void carica();
  }, [carica]);

  async function cambia(r: Richiesta, stato: string) {
    try {
      await chiamaGestore('richieste', 'PATCH', { id: r.id, stato });
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  return (
    <div>
      <div className={css.barra} role="group" aria-label="Quali richieste">
        {FILTRI.map((f) => (
          <button
            key={f.valore}
            type="button"
            className={css.filtro}
            aria-pressed={filtro === f.valore}
            onClick={() => setFiltro(f.valore)}
          >
            {f.testo}
          </button>
        ))}
      </div>
      {errore && (
        <p className={css.errore} role="alert">
          {errore}
        </p>
      )}
      {elenco === null ? (
        <p className={css.vuoto}>Carico le richieste…</p>
      ) : elenco.length === 0 ? (
        <p className={css.vuoto}>Nessuna richiesta in questo elenco.</p>
      ) : (
        <ul className={css.elenco}>
          {elenco.map((r) => (
            <li key={r.id} className={css.voce}>
              <div className={css.riga}>
                <span className={css.titolo}>{r.cosa}</span>
                {r.categoria && <span className={css.stato}>{r.categoria}</span>}
              </div>
              <p className={css.dettaglio}>
                {dataBreve(r.creataIl)} · {r.nome} · <a href={indirizzoRisposta(r)}>{r.email}</a>
                {r.telefono && (
                  <>
                    {' · '}
                    <a href={'tel:' + r.telefono.replace(/\s/g, '')}>{r.telefono}</a>
                  </>
                )}
              </p>
              <div className={css.azioni} role="group" aria-label="Stato della richiesta">
                {STATI.map((s) => (
                  <button
                    key={s.valore}
                    type="button"
                    className={css.filtro}
                    aria-pressed={r.stato === s.valore}
                    onClick={() => cambia(r, s.valore)}
                  >
                    {s.testo}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

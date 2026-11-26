/* Isola dell'area gestore: le prenotazioni dei clienti, con i pulsanti per farle avanzare
   (da confermare → confermata → arrivata → ritirata, oppure annullata). */
import { useCallback, useEffect, useState } from 'react';
import { chiamaGestore, dataBreve } from '../../../lib/gestore-browser';
import css from './Gestore.module.css';

type Prenotazione = {
  id: string;
  titolo: string;
  codiceProdotto: string;
  copie: number;
  stato: string;
  creataIl: string;
  cliente: string;
  email: string;
  telefono: string | null;
};

const FILTRI = [
  { valore: 'aperte', testo: 'Aperte' },
  { valore: 'richiesta', testo: 'Da confermare' },
  { valore: 'confermata', testo: 'Confermate' },
  { valore: 'arrivata', testo: 'Arrivate' },
  { valore: 'chiuse', testo: 'Chiuse' },
  { valore: 'tutte', testo: 'Tutte' },
];

const NOME_STATO: Record<string, string> = {
  richiesta: 'Da confermare',
  confermata: 'Confermata',
  arrivata: 'Arrivata',
  ritirata: 'Ritirata',
  annullata: 'Annullata',
};

const PROSSIMO: Record<string, { stato: string; testo: string } | undefined> = {
  richiesta: { stato: 'confermata', testo: 'Conferma' },
  confermata: { stato: 'arrivata', testo: 'È arrivata' },
  arrivata: { stato: 'ritirata', testo: 'Ritirata' },
};

const coloreStato = (stato: string) =>
  stato === 'confermata' || stato === 'arrivata'
    ? css.verde
    : stato === 'ritirata' || stato === 'annullata'
      ? css.grigio
      : '';

export default function PrenotazioniGestore() {
  const [filtro, setFiltro] = useState('aperte');
  const [elenco, setElenco] = useState<Prenotazione[] | null>(null);
  const [errore, setErrore] = useState('');
  const [inCorso, setInCorso] = useState('');

  const carica = useCallback(async () => {
    setErrore('');
    try {
      const dati = await chiamaGestore<{ prenotazioni: Prenotazione[] }>('prenotazioni?filtro=' + filtro);
      setElenco(dati.prenotazioni);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [filtro]);

  useEffect(() => {
    void carica();
  }, [carica]);

  async function cambia(p: Prenotazione, stato: string) {
    if (stato === 'annullata' && !confirm(`Annullare la prenotazione di ${p.cliente}? Riceverà un'email.`))
      return;
    setInCorso(p.id);
    try {
      await chiamaGestore('prenotazioni', 'PATCH', { id: p.id, stato });
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInCorso('');
    }
  }

  return (
    <div>
      <div className={css.barra} role="group" aria-label="Quali prenotazioni">
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
        <p className={css.vuoto}>Carico le prenotazioni…</p>
      ) : elenco.length === 0 ? (
        <p className={css.vuoto}>Nessuna prenotazione in questo elenco.</p>
      ) : (
        <ul className={css.elenco}>
          {elenco.map((p) => {
            const prossimo = PROSSIMO[p.stato];
            const chiusa = p.stato === 'ritirata' || p.stato === 'annullata';
            return (
              <li key={p.id} className={`${css.voce} ${chiusa ? css.spenta : ''}`}>
                <div className={css.riga}>
                  <a className={css.titolo} href={'/prodotto/' + encodeURIComponent(p.codiceProdotto)}>
                    {p.titolo}
                  </a>
                  <span className={`${css.stato} ${coloreStato(p.stato)}`}>
                    {NOME_STATO[p.stato] ?? p.stato}
                  </span>
                </div>
                <p className={css.dettaglio}>
                  {p.copie} {p.copie === 1 ? 'copia' : 'copie'} · prenotata il {dataBreve(p.creataIl)} ·{' '}
                  {p.cliente} · <a href={'mailto:' + p.email}>{p.email}</a>
                  {p.telefono && (
                    <>
                      {' · '}
                      <a href={'tel:' + p.telefono.replace(/\s/g, '')}>{p.telefono}</a>
                    </>
                  )}
                </p>
                {!chiusa && (
                  <div className={css.azioni}>
                    {prossimo && (
                      <button
                        type="button"
                        className={css.azione}
                        disabled={inCorso === p.id}
                        onClick={() => cambia(p, prossimo.stato)}
                      >
                        {prossimo.testo}
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${css.azione} ${css.pericolo}`}
                      disabled={inCorso === p.id}
                      onClick={() => cambia(p, 'annullata')}
                    >
                      Annulla
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

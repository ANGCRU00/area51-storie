/* Isola dell'area gestore: le prossime uscite. Per ognuna: mostrarla sul sito o no, e l'ultimo giorno per prenotare. */
import { useEffect, useState } from 'react';
import { chiamaGestore, dataBreve, euro } from '../../../lib/gestore-browser';
import css from './Gestore.module.css';

type Uscita = {
  id: string;
  titolo: string;
  editore: string | null;
  categoria: string | null;
  dataUscita: string | null;
  dataLimite: string | null;
  visibile: boolean;
  prezzo: number | null;
  ean: string | null;
  riferimentoEsterno: string | null;
  copertina: string | null;
};

const FILTRI = [
  { valore: 'prossime', testo: 'Prossime' },
  { valore: 'nascoste', testo: 'Nascoste' },
  { valore: 'tutte', testo: 'Tutte' },
];
const PER_PAGINA = 50;

function RigaUscita({ uscita, aggiorna }: { uscita: Uscita; aggiorna: (u: Uscita) => void }) {
  const [errore, setErrore] = useState('');
  const [salvato, setSalvato] = useState(false);

  async function salva(modifica: { visibile?: boolean; dataLimite?: string | null }) {
    setErrore('');
    try {
      const dati = await chiamaGestore<{ uscita: Pick<Uscita, 'visibile' | 'dataLimite'> }>(
        'uscite',
        'PATCH',
        { id: uscita.id, ...modifica },
      );
      aggiorna({ ...uscita, ...dati.uscita });
      setSalvato(true);
      setTimeout(() => setSalvato(false), 1500);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  const codice = uscita.ean || uscita.riferimentoEsterno || uscita.id;
  return (
    <li className={`${css.voce} ${css.uscita} ${uscita.visibile ? '' : css.spenta}`}>
      {uscita.copertina ? (
        <img
          className={css.copertina}
          src={'/file/' + uscita.copertina}
          alt=""
          width="48"
          height="72"
          loading="lazy"
        />
      ) : (
        <span className={css.copertina} aria-hidden="true" />
      )}
      <div className={css.elenco}>
        <a className={css.titolo} href={'/prodotto/' + encodeURIComponent(codice)}>
          {uscita.titolo}
        </a>
        <p className={css.dettaglio}>
          {[
            uscita.editore,
            uscita.categoria,
            uscita.dataUscita && 'esce il ' + dataBreve(uscita.dataUscita),
            euro(uscita.prezzo),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className={css.campi}>
          <label>
            <input
              type="checkbox"
              checked={uscita.visibile}
              onChange={(e) => salva({ visibile: e.target.checked })}
            />
            Visibile sul sito
          </label>
          <label>
            Prenotabile fino al
            <input
              type="date"
              value={uscita.dataLimite ?? ''}
              max={uscita.dataUscita ?? undefined}
              onChange={(e) => salva({ dataLimite: e.target.value || null })}
            />
          </label>
          {uscita.dataLimite && (
            <button type="button" className={css.togli} onClick={() => salva({ dataLimite: null })}>
              da confermare
            </button>
          )}
          {salvato && <span className={css.messaggio}>Salvato ✓</span>}
        </div>
        {errore && <p className={css.errore}>{errore}</p>}
      </div>
    </li>
  );
}

export default function UsciteGestore() {
  const [filtro, setFiltro] = useState('prossime');
  const [cerca, setCerca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [dati, setDati] = useState<{ righe: Uscita[]; totale: number } | null>(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    const attesa = setTimeout(async () => {
      setErrore('');
      try {
        const parametri = new URLSearchParams({ filtro, cerca, pagina: String(pagina) });
        setDati(await chiamaGestore<{ righe: Uscita[]; totale: number }>('uscite?' + parametri));
      } catch (e) {
        setErrore((e as Error).message);
      }
    }, 250);
    return () => clearTimeout(attesa);
  }, [filtro, cerca, pagina]);

  const pagine = dati ? Math.max(1, Math.ceil(dati.totale / PER_PAGINA)) : 1;
  const aggiorna = (u: Uscita) =>
    setDati((d) => d && { ...d, righe: d.righe.map((x) => (x.id === u.id ? u : x)) });

  return (
    <div>
      <div className={css.barra}>
        <input
          className={css.cerca}
          type="search"
          placeholder="Cerca titolo, editore o EAN"
          value={cerca}
          aria-label="Cerca tra le uscite"
          onChange={(e) => {
            setCerca(e.target.value);
            setPagina(1);
          }}
        />
        {FILTRI.map((f) => (
          <button
            key={f.valore}
            type="button"
            className={css.filtro}
            aria-pressed={filtro === f.valore}
            onClick={() => {
              setFiltro(f.valore);
              setPagina(1);
            }}
          >
            {f.testo}
          </button>
        ))}
        {dati && <span className={css.conteggio}>{dati.totale} uscite</span>}
      </div>
      {errore && (
        <p className={css.errore} role="alert">
          {errore}
        </p>
      )}
      {dati === null ? (
        <p className={css.vuoto}>Carico le uscite…</p>
      ) : dati.righe.length === 0 ? (
        <p className={css.vuoto}>Nessuna uscita trovata.</p>
      ) : (
        <ul className={css.elenco}>
          {dati.righe.map((u) => (
            <RigaUscita key={u.id} uscita={u} aggiorna={aggiorna} />
          ))}
        </ul>
      )}
      {pagine > 1 && (
        <div className={css.pagine}>
          <button
            type="button"
            className={`${css.azione} ${css.secondaria}`}
            disabled={pagina <= 1}
            onClick={() => setPagina(pagina - 1)}
          >
            ← Prima
          </button>
          Pagina {pagina} di {pagine}
          <button
            type="button"
            className={`${css.azione} ${css.secondaria}`}
            disabled={pagina >= pagine}
            onClick={() => setPagina(pagina + 1)}
          >
            Dopo →
          </button>
        </div>
      )}
    </div>
  );
}

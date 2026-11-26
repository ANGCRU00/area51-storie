/* Isola dell'area gestore: genere ed età di ogni serie. Si parte dalla proposta di AniList (quando c'è),
   si corregge se serve e si conferma. Le serie confermate non cambiano più da sole. */
import { useEffect, useState } from 'react';
import { chiamaGestore } from '../../../lib/gestore-browser';
import css from './Gestore.module.css';

type Serie = {
  chiave: string;
  nome: string;
  categoria: string | null;
  volumi: number;
  generi: string[];
  adulti: boolean;
  confermata: boolean;
  proposta: { titolo: string; generi: string[]; somiglianza: number | null; id: number | null } | null;
};
type Risposta = { righe: Serie[]; totale: number; daConfermare: number };

const FILTRI = [
  { valore: 'da-confermare', testo: 'Da confermare' },
  { valore: 'per-adulti', testo: '18+' },
  { valore: 'confermate', testo: 'Confermate' },
  { valore: 'tutte', testo: 'Tutte' },
];
const PER_PAGINA = 40;
const SOMIGLIANZA_DUBBIA = 0.9;

function SchedaSerie({ iniziale, generi }: { iniziale: Serie; generi: [string, string][] }) {
  const [serie, setSerie] = useState(iniziale);
  const [scelti, setScelti] = useState(new Set(iniziale.generi));
  const [adulti, setAdulti] = useState(iniziale.adulti);
  const [stato, setStato] = useState<{ tipo: 'pronto' | 'invio' | 'ok' } | { tipo: 'errore'; testo: string }>(
    { tipo: 'pronto' },
  );

  function scambia(genere: string) {
    const nuovi = new Set(scelti);
    if (nuovi.has(genere)) nuovi.delete(genere);
    else nuovi.add(genere);
    setScelti(nuovi);
  }

  async function conferma() {
    setStato({ tipo: 'invio' });
    try {
      const dati = await chiamaGestore<{ serie: Pick<Serie, 'generi' | 'adulti' | 'confermata'> }>(
        'serie',
        'PATCH',
        {
          chiave: serie.chiave,
          nome: serie.nome,
          generi: [...scelti],
          adulti,
        },
      );
      setSerie({ ...serie, ...dati.serie });
      setStato({ tipo: 'ok' });
    } catch (e) {
      setStato({ tipo: 'errore', testo: (e as Error).message });
    }
  }

  const p = serie.proposta;
  const dubbia = p?.somiglianza != null && p.somiglianza < SOMIGLIANZA_DUBBIA;
  return (
    <li className={css.voce}>
      <div className={css.riga}>
        <span className={css.titolo}>{serie.nome}</span>
        <span className={`${css.stato} ${serie.confermata ? css.verde : ''}`}>
          {serie.confermata ? 'Confermata' : 'Da confermare'}
        </span>
      </div>
      <p className={css.dettaglio}>
        {[
          serie.categoria,
          `${serie.volumi} ${serie.volumi === 1 ? 'titolo' : 'titoli'} sul sito`,
          serie.chiave,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {p && (
        <p className={css.proposta}>
          Proposta AniList:{' '}
          {p.id ? (
            <a href={`https://anilist.co/manga/${p.id}`} target="_blank" rel="noopener noreferrer">
              {p.titolo}
            </a>
          ) : (
            p.titolo
          )}
          {p.somiglianza != null && <> · somiglianza {Math.round(p.somiglianza * 100)}%</>}
          {dubbia && <span className={css.dubbia}> · controlla: potrebbe essere un'altra opera</span>}
          {p.generi.length > 0 && <> · generi AniList: {p.generi.join(', ')}</>}
        </p>
      )}
      <fieldset className={css.generi}>
        <legend className="solo-lettori">Generi di {serie.nome}</legend>
        {generi.map(([chiave, nome]) => (
          <label key={chiave}>
            <input type="checkbox" checked={scelti.has(chiave)} onChange={() => scambia(chiave)} />
            {nome}
          </label>
        ))}
        <label className={css.adulti}>
          <input type="checkbox" checked={adulti} onChange={(e) => setAdulti(e.target.checked)} />
          18+ (solo per adulti)
        </label>
      </fieldset>
      <div className={css.azioni}>
        <button type="button" className={css.azione} disabled={stato.tipo === 'invio'} onClick={conferma}>
          {serie.confermata ? 'Salva le modifiche' : 'Conferma'}
        </button>
        {stato.tipo === 'ok' && <span className={css.messaggio}>Salvato ✓</span>}
        {stato.tipo === 'errore' && <span className={css.errore}>{stato.testo}</span>}
      </div>
    </li>
  );
}

export default function SerieGestore({ generi }: { generi: [string, string][] }) {
  const [filtro, setFiltro] = useState('da-confermare');
  const [cerca, setCerca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [dati, setDati] = useState<Risposta | null>(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    const attesa = setTimeout(async () => {
      setErrore('');
      try {
        const parametri = new URLSearchParams({ filtro, cerca, pagina: String(pagina) });
        setDati(await chiamaGestore<Risposta>('serie?' + parametri));
      } catch (e) {
        setErrore((e as Error).message);
      }
    }, 250);
    return () => clearTimeout(attesa);
  }, [filtro, cerca, pagina]);

  const pagine = dati ? Math.max(1, Math.ceil(dati.totale / PER_PAGINA)) : 1;
  return (
    <div>
      <div className={css.barra}>
        <input
          className={css.cerca}
          type="search"
          placeholder="Cerca una serie"
          value={cerca}
          aria-label="Cerca tra le serie"
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
        {dati && (
          <span className={css.conteggio}>
            {dati.totale} serie · {dati.daConfermare} da confermare in tutto
          </span>
        )}
      </div>
      {errore && (
        <p className={css.errore} role="alert">
          {errore}
        </p>
      )}
      {dati === null ? (
        <p className={css.vuoto}>Carico le serie…</p>
      ) : dati.righe.length === 0 ? (
        <p className={css.vuoto}>Nessuna serie in questo elenco.</p>
      ) : (
        <ul className={css.elenco}>
          {dati.righe.map((s) => (
            <SchedaSerie key={s.chiave + filtro + pagina} iniziale={s} generi={generi} />
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

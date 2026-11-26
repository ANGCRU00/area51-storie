/* Isola: i due pulsanti "Appena usciti / Prossime uscite" e le schede della home.
   Le schede arrivano già pronte dal server (props), quindi sono nell'HTML anche senza JavaScript;
   qui c'è solo ciò che risponde ai tocchi: cambio di elenco e "Prenota". */
import { useRef, useState } from 'react';
import { prenotaDalSito } from '../../lib/prenota-dal-sito';
import css from './NuoviArrivi.module.css';

export type Scheda = {
  codice: string;
  titolo: string;
  editore: string | null;
  prezzo: number | null;
  quando: string;
  pre: boolean;
  copertina: string | null;
};

const euro = (x: number | null) =>
  x == null ? 'Prezzo da confermare' : x.toFixed(2).replace('.', ',') + ' €';

export default function NuoviArrivi({ nuovi, prossime }: { nuovi: Scheda[]; prossime: Scheda[] }) {
  const [tipo, setTipo] = useState<'nuovi' | 'prossime'>(nuovi.length ? 'nuovi' : 'prossime');
  const [aggiunto, setAggiunto] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const elenco = tipo === 'nuovi' ? nuovi : prossime;

  const [avviso, setAvviso] = useState<{ codice: string; testo: string } | null>(null);

  async function prenota(s: Scheda) {
    const esito = await prenotaDalSito(s.codice, 1);
    if (!esito.messaggio) return;
    if (!esito.ok) return setAvviso({ codice: s.codice, testo: esito.messaggio });
    setAvviso(null);
    setAggiunto(s.codice);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAggiunto(''), 2500);
  }

  return (
    <>
      <div className={css.scelta} role="group" aria-label="Scegli cosa vedere">
        <button
          type="button"
          aria-pressed={tipo === 'nuovi'}
          className={tipo === 'nuovi' ? css.attivo : css.spento}
          onClick={() => setTipo('nuovi')}
        >
          Appena usciti
        </button>
        <button
          type="button"
          aria-pressed={tipo === 'prossime'}
          className={tipo === 'prossime' ? css.attivo : css.spento}
          onClick={() => setTipo('prossime')}
        >
          Prossime uscite
        </button>
      </div>
      {elenco.length === 0 && (
        <p className={css.vuoto}>
          Per ora non ci sono {tipo === 'prossime' ? 'uscite annunciate' : 'novità'}.
        </p>
      )}
      <div className={css.griglia}>
        {elenco.map((s) => (
          <article key={tipo + s.codice} className={css.scheda}>
            <a href={'/prodotto/' + encodeURIComponent(s.codice)} className={css.collegamento}>
              <div className={css.copertina}>
                {s.copertina ? (
                  <img
                    src={s.copertina}
                    alt={'Copertina di ' + s.titolo}
                    width="220"
                    height="320"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className={'pesante ' + css.senza}>{s.titolo}</span>
                )}
                <span className={'pesante ' + css.etichetta + ' ' + (s.pre ? css.etichettaPre : '')}>
                  {s.pre ? 'PREORDINE' : 'NOVITÀ'}
                </span>
              </div>
              {s.editore && <p className={css.editore}>{s.editore}</p>}
              <h3 className={'pesante ' + css.titolo}>{s.titolo}</h3>
              <p className={css.quando}>{s.quando}</p>
            </a>
            <div className={css.piede}>
              <span className={'pesante ' + css.prezzo}>{euro(s.prezzo)}</span>
              <button type="button" onClick={() => prenota(s)} className={'pesante ' + css.prenota}>
                {aggiunto === s.codice ? 'Prenotato ✓' : 'Prenota'}
              </button>
              {avviso?.codice === s.codice && (
                <p className={css.avviso} role="status">
                  {avviso.testo}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

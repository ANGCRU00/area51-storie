/* Isola: le serie seguite (pulsante "Segui la serie" della scheda prodotto), con la prossima uscita di ognuna. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ascolta, serie, type SerieSeguita } from '../../lib/negozio';
import { dataLunga } from '../../lib/prodotti/formati';
import css from './SerieSeguite.module.css';

type ProssimaUscita = { titolo: string; data: string; codice: string };
type Prossime = Map<string, ProssimaUscita | null>;

const nessuna: SerieSeguita[] = [];
let ultimoTesto = '';
let ultimoElenco: SerieSeguita[] = nessuna;

function leggi(): SerieSeguita[] {
  const elenco = serie.tutti();
  const testo = JSON.stringify(elenco);
  if (testo !== ultimoTesto) {
    ultimoTesto = testo;
    ultimoElenco = elenco;
  }
  return ultimoElenco;
}

const chiave = (s: { s: string; e: string }) => s.s.toLowerCase() + '|' + s.e;

async function leggiProssime(): Promise<Prossime> {
  const risposta = await fetch('/api/raccolte');
  if (!risposta.ok) return new Map();
  const dati = (await risposta.json()) as { serie: (SerieSeguita & { prossima: ProssimaUscita | null })[] };
  return new Map(dati.serie.map((s) => [chiave(s), s.prossima]));
}

function RigaUscita({
  prossima,
  inAttesa,
}: {
  prossima: ProssimaUscita | null | undefined;
  inAttesa: boolean;
}) {
  if (prossima) {
    return (
      <a className={css.uscita} href={'/prodotto/' + encodeURIComponent(prossima.codice)}>
        <span className={css.etichetta}>Prossima uscita</span>
        <span>
          {prossima.titolo} · {dataLunga(prossima.data)}
        </span>
        <span className={css.prenota}>Vedi e prenota →</span>
      </a>
    );
  }
  return (
    <p className={css.nessuna}>
      {inAttesa ? 'Cerco le prossime uscite…' : 'Nessuna uscita in arrivo per ora.'}
    </p>
  );
}

export default function SerieSeguite() {
  const elenco = useSyncExternalStore(ascolta, leggi, () => nessuna);
  const [prossime, setProssime] = useState<Prossime | null>(null);

  useEffect(() => {
    leggiProssime()
      .then(setProssime)
      .catch(() => setProssime(new Map()));
  }, [elenco.length]);

  if (!elenco.length) {
    return (
      <p className={css.vuoto}>
        Non segui ancora nessuna serie. Nella scheda di un manga o di un fumetto tocca "Segui la serie": qui
        vedrai quando esce il prossimo volume.
      </p>
    );
  }
  return (
    <ul className={css.elenco}>
      {elenco.map((s) => (
        <li key={chiave(s)} className={css.voce}>
          <div className={css.testa}>
            <a className={css.nome} href={'/catalogo?cerca=' + encodeURIComponent(s.s)}>
              {s.s}
              {s.e && <span>{s.e}</span>}
            </a>
            <button
              type="button"
              className={css.togli}
              onClick={() => serie.scambia(s.s, s.e)}
              aria-label={'Smetti di seguire ' + s.s}
            >
              Smetti di seguire
            </button>
          </div>
          <RigaUscita prossima={prossime?.get(chiave(s))} inAttesa={prossime === null} />
        </li>
      ))}
    </ul>
  );
}

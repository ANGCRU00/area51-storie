/* Isola: modulo "Chiedicelo" della pagina /negozio. Invia la richiesta a /api/chiedicelo e mostra l'esito.
   Il controllo vero dei dati lo fa il server; qui si controlla solo quanto basta per avvisare subito chi compila. */
import { useState, type FormEvent } from 'react';
import css from './Chiedicelo.module.css';

const CATEGORIE = [
  'Manga e fumetti',
  'TCG',
  'Giochi da tavolo',
  'Giochi di ruolo',
  'Figure e Funko',
  'Warhammer',
  'Gadget',
];
type Stato = { tipo: 'pronto' } | { tipo: 'invio' } | { tipo: 'ok' } | { tipo: 'errore'; testo: string };

export default function Chiedicelo() {
  const [stato, setStato] = useState<Stato>({ tipo: 'pronto' });

  async function invia(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget,
      d = new FormData(f);
    const corpo = {
      cosa: String(d.get('cosa') ?? ''),
      categoria: String(d.get('categoria') ?? ''),
      nome: String(d.get('nome') ?? ''),
      telefono: String(d.get('telefono') ?? ''),
      email: String(d.get('email') ?? ''),
      sito: String(d.get('sito') ?? ''),
      privacy: d.get('privacy') === 'si',
    };
    if (corpo.cosa.trim().length < 3) return setStato({ tipo: 'errore', testo: 'Scrivi cosa cerchi.' });
    if (!corpo.nome.trim()) return setStato({ tipo: 'errore', testo: 'Scrivi il tuo nome.' });
    if (!corpo.email.includes('@'))
      return setStato({ tipo: 'errore', testo: "Controlla l'indirizzo email." });
    if (!corpo.privacy)
      return setStato({ tipo: 'errore', testo: 'Spunta il consenso per farci rispondere.' });
    setStato({ tipo: 'invio' });
    try {
      const r = await fetch('/api/chiedicelo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok)
        return setStato({
          tipo: 'errore',
          testo: j.errore ?? 'Non siamo riusciti a inviare la richiesta. Riprova o chiamaci.',
        });
      f.reset();
      setStato({ tipo: 'ok' });
    } catch {
      setStato({
        tipo: 'errore',
        testo: 'Connessione assente: riprova tra poco o chiamaci allo 0883 884567.',
      });
    }
  }

  return (
    <form className={css.modulo} onSubmit={invia} noValidate>
      <div>
        <label htmlFor="ch-cosa" className={'pesante ' + css.etichetta}>
          Cosa cerchi
        </label>
        <textarea
          id="ch-cosa"
          name="cosa"
          rows={3}
          maxLength={300}
          required
          className={css.campo + ' ' + css.area}
          placeholder="Titolo, gioco o manuale (anche il volume o l'edizione)"
        />
      </div>
      <div>
        <label htmlFor="ch-cat" className={'pesante ' + css.etichetta}>
          Di che categoria è <span className={css.facoltativo}>(facoltativo)</span>
        </label>
        <select id="ch-cat" name="categoria" className={css.campo} defaultValue="">
          <option value="">Non so / altro</option>
          {CATEGORIE.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className={css.coppia}>
        <div>
          <label htmlFor="ch-nome" className={'pesante ' + css.etichetta}>
            Il tuo nome
          </label>
          <input
            id="ch-nome"
            name="nome"
            type="text"
            maxLength={40}
            autoComplete="given-name"
            required
            className={css.campo}
            placeholder="Come ti chiami"
          />
        </div>
        <div>
          <label htmlFor="ch-tel" className={'pesante ' + css.etichetta}>
            Telefono <span className={css.facoltativo}>(facoltativo)</span>
          </label>
          <input
            id="ch-tel"
            name="telefono"
            type="tel"
            maxLength={20}
            autoComplete="tel"
            className={css.campo}
            placeholder="Se preferisci una chiamata"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ch-email" className={'pesante ' + css.etichetta}>
          La tua email
        </label>
        <input
          id="ch-email"
          name="email"
          type="email"
          maxLength={80}
          autoComplete="email"
          required
          className={css.campo}
          placeholder="nome@esempio.it"
        />
      </div>
      <div className={css.trappola} aria-hidden="true">
        <label>
          Non compilare questo campo <input type="text" name="sito" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className={css.consenso}>
        <input id="ch-privacy" name="privacy" value="si" type="checkbox" required />
        <span>
          Accetto che Area 51 usi questi dati solo per rispondere a questa richiesta.{' '}
          <a href="/privacy" target="_blank" rel="noopener">
            Informativa sulla privacy
          </a>
        </span>
      </label>
      <div className={css.invio}>
        <button type="submit" className="pulsante" disabled={stato.tipo === 'invio'}>
          {stato.tipo === 'invio' ? 'Invio in corso…' : 'Invia la richiesta'}
        </button>
        <p role="status" className={stato.tipo === 'errore' ? css.esitoErrore : css.esito}>
          {stato.tipo === 'ok'
            ? 'Richiesta inviata: ti ricontattiamo presto.'
            : stato.tipo === 'errore'
              ? stato.testo
              : ''}
        </p>
      </div>
    </form>
  );
}

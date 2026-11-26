/* Isola: "I miei dati" dell'account. Nome e telefono (/api/profilo), cambio password ed eliminazione
   dell'account (Better Auth su /api/accesso). L'email non si cambia dal sito. */
import { useState, type FormEvent } from 'react';
import { chiamaAccesso } from '../../lib/accesso-browser';
import { scollegaAccount } from '../../lib/negozio';
import css from './DatiAccount.module.css';

type Esito =
  { tipo: 'pronto' } | { tipo: 'invio' } | { tipo: 'ok'; testo: string } | { tipo: 'errore'; testo: string };

const valore = (dati: FormData, nome: string) => String(dati.get(nome) ?? '');

function Messaggio({ esito }: { esito: Esito }) {
  const testo = esito.tipo === 'ok' || esito.tipo === 'errore' ? esito.testo : '';
  return (
    <p role="status" className={esito.tipo === 'errore' ? css.errore : css.messaggio}>
      {testo}
    </p>
  );
}

function useInvio(azione: (dati: FormData, modulo: HTMLFormElement) => Promise<string>) {
  const [esito, setEsito] = useState<Esito>({ tipo: 'pronto' });
  async function invia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const modulo = evento.currentTarget;
    setEsito({ tipo: 'invio' });
    try {
      setEsito({ tipo: 'ok', testo: await azione(new FormData(modulo), modulo) });
    } catch (e) {
      setEsito({ tipo: 'errore', testo: (e as Error).message });
    }
  }
  return { esito, invia, occupato: esito.tipo === 'invio' };
}

function Anagrafica({ nome, email, telefono }: { nome: string; email: string; telefono: string }) {
  const { esito, invia, occupato } = useInvio(async (dati) => {
    const risposta = await fetch('/api/profilo', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nome: valore(dati, 'nome'), telefono: valore(dati, 'telefono') }),
    });
    const corpo = await risposta.json().catch(() => ({}));
    if (!risposta.ok) throw new Error(corpo.errore ?? 'Non sono riuscito a salvare. Riprova.');
    document.querySelectorAll('[data-nome-utente]').forEach((n) => (n.textContent = corpo.profilo.nome));
    return 'Dati salvati.';
  });

  return (
    <form className={css.modulo} onSubmit={invia} noValidate>
      <h3 className={css.titolo}>I tuoi dati</h3>
      <div className={css.campo}>
        <label htmlFor="dati-nome">Nome</label>
        <input
          id="dati-nome"
          name="nome"
          defaultValue={nome}
          autoComplete="given-name"
          maxLength={60}
          required
        />
      </div>
      <div className={css.campo}>
        <label htmlFor="dati-telefono">Telefono (facoltativo)</label>
        <input
          id="dati-telefono"
          name="telefono"
          type="tel"
          defaultValue={telefono}
          autoComplete="tel"
          maxLength={30}
          inputMode="tel"
        />
        <span className={css.aiuto}>Il negozio può usarlo per avvisarti di una prenotazione.</span>
      </div>
      <div className={css.campo}>
        <label htmlFor="dati-email">Email</label>
        <input id="dati-email" value={email} readOnly aria-describedby="dati-email-aiuto" />
        <span className={css.aiuto} id="dati-email-aiuto">
          L'email non si cambia dal sito: se ti serve, chiedi in negozio.
        </span>
      </div>
      <button type="submit" className="pulsante" disabled={occupato}>
        {occupato ? 'Un attimo…' : 'Salva i dati'}
      </button>
      <Messaggio esito={esito} />
    </form>
  );
}

function CambioPassword() {
  const { esito, invia, occupato } = useInvio(async (dati, modulo) => {
    const nuova = valore(dati, 'nuova');
    if (nuova.length < 8) throw new Error('La nuova password deve avere almeno 8 caratteri.');
    if (nuova !== valore(dati, 'ripeti')) throw new Error('Le due password nuove non coincidono.');
    await chiamaAccesso('change-password', {
      currentPassword: valore(dati, 'attuale'),
      newPassword: nuova,
      revokeOtherSessions: dati.get('altri') === 'si',
    });
    modulo.reset();
    return 'Password cambiata.';
  });

  return (
    <form className={css.modulo} onSubmit={invia} noValidate>
      <h3 className={css.titolo}>Cambia password</h3>
      <div className={css.campo}>
        <label htmlFor="pw-attuale">Password attuale</label>
        <input
          id="pw-attuale"
          name="attuale"
          type="password"
          autoComplete="current-password"
          maxLength={128}
        />
      </div>
      <div className={css.campo}>
        <label htmlFor="pw-nuova">Nuova password</label>
        <input
          id="pw-nuova"
          name="nuova"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
        />
        <span className={css.aiuto}>Almeno 8 caratteri.</span>
      </div>
      <div className={css.campo}>
        <label htmlFor="pw-ripeti">Ripeti la nuova password</label>
        <input id="pw-ripeti" name="ripeti" type="password" autoComplete="new-password" maxLength={128} />
      </div>
      <label className={css.casella}>
        <input type="checkbox" name="altri" value="si" defaultChecked />
        <span>Esci dall'account sugli altri dispositivi</span>
      </label>
      <button type="submit" className="pulsante" disabled={occupato}>
        {occupato ? 'Un attimo…' : 'Cambia password'}
      </button>
      <Messaggio esito={esito} />
    </form>
  );
}

function EliminaAccount() {
  const [aperto, setAperto] = useState(false);
  const { esito, invia, occupato } = useInvio(async (dati) => {
    if (dati.get('capito') !== 'si') throw new Error('Spunta la casella per confermare.');
    await chiamaAccesso('delete-user', { password: valore(dati, 'password') });
    scollegaAccount();
    location.href = '/';
    return 'Account eliminato.';
  });

  if (!aperto) {
    return (
      <div className={css.pericolo}>
        <h3 className={css.titolo}>Elimina l'account</h3>
        <p className={css.aiuto}>
          Cancella per sempre il tuo account, le prenotazioni, i preferiti e le serie che segui.
        </p>
        <button type="button" className={css.elimina} onClick={() => setAperto(true)}>
          Voglio eliminare l'account
        </button>
      </div>
    );
  }
  return (
    <form className={`${css.modulo} ${css.pericolo}`} onSubmit={invia} noValidate>
      <h3 className={css.titolo}>Elimina l'account</h3>
      <p className={css.avviso}>
        Non si può annullare. Le prenotazioni ancora aperte non varranno più: se hai già concordato un ritiro,
        avvisa il negozio.
      </p>
      <div className={css.campo}>
        <label htmlFor="elimina-password">La tua password</label>
        <input
          id="elimina-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
        />
      </div>
      <label className={css.casella}>
        <input type="checkbox" name="capito" value="si" />
        <span>Ho capito: elimina il mio account e tutti i suoi dati.</span>
      </label>
      <div className={css.azioni}>
        <button type="submit" className={css.elimina} disabled={occupato}>
          {occupato ? 'Un attimo…' : 'Elimina per sempre'}
        </button>
        <button type="button" className={css.annulla} onClick={() => setAperto(false)}>
          Annulla
        </button>
      </div>
      <Messaggio esito={esito} />
    </form>
  );
}

export default function DatiAccount(props: { nome: string; email: string; telefono: string }) {
  return (
    <div className={css.sezioni}>
      <Anagrafica {...props} />
      <CambioPassword />
      <EliminaAccount />
    </div>
  );
}

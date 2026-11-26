/* Isola: i quattro moduli dell'account (accedi, registrati, recupera la password, nuova password).
   Parla con Better Auth su /api/accesso; i messaggi d'errore sono tradotti in italiano. */
import { useState, type FormEvent } from 'react';
import css from './ModuloAccesso.module.css';

export type Modo = 'accedi' | 'registrati' | 'recupera' | 'nuova';
type Esito =
  { tipo: 'pronto' } | { tipo: 'invio' } | { tipo: 'ok'; testo: string } | { tipo: 'errore'; testo: string };

const MESSAGGI: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email o password non corrette.',
  EMAIL_NOT_VERIFIED:
    'Prima di accedere conferma la tua email: trovi il link nella posta (guarda anche nello spam).',
  USER_ALREADY_EXISTS:
    'Esiste già un account con questa email: prova ad accedere o a recuperare la password.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'Esiste già un account con questa email: prova ad accedere o a recuperare la password.',
  PASSWORD_TOO_SHORT: 'La password deve avere almeno 8 caratteri.',
  PASSWORD_TOO_LONG: 'La password è troppo lunga.',
  INVALID_EMAIL: "Controlla l'indirizzo email.",
  INVALID_TOKEN: 'Il link non è più valido: chiedi un nuovo link per la password.',
};

async function chiama(percorso: string, dati: Record<string, unknown>) {
  const risposta = await fetch('/api/accesso/' + percorso, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(dati),
  });
  const corpo = await risposta.json().catch(() => ({}));
  if (risposta.status === 429) throw new Error('Troppi tentativi: aspetta un minuto e riprova.');
  if (!risposta.ok)
    throw Object.assign(new Error(MESSAGGI[corpo.code] ?? 'Qualcosa non ha funzionato. Riprova.'), {
      codice: corpo.code,
    });
  return corpo;
}

const valore = (dati: FormData, nome: string) => String(dati.get(nome) ?? '').trim();

export default function ModuloAccesso({
  modo,
  torna = '/account',
  token = '',
}: {
  modo: Modo;
  torna?: string;
  token?: string;
}) {
  const [esito, setEsito] = useState<Esito>({ tipo: 'pronto' });
  const [emailDaConfermare, setEmailDaConfermare] = useState('');

  async function invia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dati = new FormData(evento.currentTarget);
    const email = valore(dati, 'email');
    const password = String(dati.get('password') ?? '');
    setEsito({ tipo: 'invio' });
    try {
      if (modo === 'accedi') {
        await chiama('sign-in/email', { email, password });
        location.href = torna;
        return;
      }
      if (modo === 'registrati') {
        if (password !== String(dati.get('ripeti') ?? '')) throw new Error('Le due password non coincidono.');
        if (dati.get('privacy') !== 'si')
          throw new Error("Per creare l'account serve il consenso all'informativa sulla privacy.");
        await chiama('sign-up/email', {
          name: valore(dati, 'nome'),
          email,
          password,
          callbackURL: '/account?benvenuto=1',
        });
        setEsito({
          tipo: 'ok',
          testo: `Ci siamo quasi! Ti abbiamo mandato un'email a ${email}: apri il link per confermare l'account.`,
        });
        return;
      }
      if (modo === 'recupera') {
        await chiama('request-password-reset', { email, redirectTo: '/nuova-password' });
        setEsito({
          tipo: 'ok',
          testo:
            "Se c'è un account con questa email, ti abbiamo mandato il link per scegliere una nuova password.",
        });
        return;
      }
      if (password !== String(dati.get('ripeti') ?? '')) throw new Error('Le due password non coincidono.');
      await chiama('reset-password', { newPassword: password, token });
      setEsito({ tipo: 'ok', testo: 'Password cambiata. Ora puoi accedere con quella nuova.' });
    } catch (e) {
      const err = e as Error & { codice?: string };
      if (err.codice === 'EMAIL_NOT_VERIFIED') setEmailDaConfermare(email);
      setEsito({ tipo: 'errore', testo: err.message });
    }
  }

  async function rimandaConferma() {
    try {
      await chiama('send-verification-email', {
        email: emailDaConfermare,
        callbackURL: '/account?benvenuto=1',
      });
      setEsito({ tipo: 'ok', testo: `Ti abbiamo rimandato l'email di conferma a ${emailDaConfermare}.` });
      setEmailDaConfermare('');
    } catch (e) {
      setEsito({ tipo: 'errore', testo: (e as Error).message });
    }
  }

  const occupato = esito.tipo === 'invio';
  const conPassword = modo !== 'recupera';
  const conEmail = modo !== 'nuova';
  const ripetiPassword = modo === 'registrati' || modo === 'nuova';
  const testoPulsante = {
    accedi: 'Accedi',
    registrati: 'Crea il mio account',
    recupera: 'Mandami il link',
    nuova: 'Salva la nuova password',
  }[modo];

  if (esito.tipo === 'ok' && modo !== 'accedi') {
    return (
      <div className={css.conferma} role="status">
        <p>{esito.testo}</p>
        {(modo === 'nuova' || modo === 'recupera') && <a href="/accedi">Torna ad accedere</a>}
      </div>
    );
  }

  return (
    <form className={css.modulo} onSubmit={invia} noValidate>
      {modo === 'registrati' && (
        <div className={css.campo}>
          <label htmlFor="acc-nome">Nome</label>
          <input id="acc-nome" name="nome" type="text" autoComplete="given-name" maxLength={60} required />
        </div>
      )}
      {conEmail && (
        <div className={css.campo}>
          <label htmlFor="acc-email">Email</label>
          <input id="acc-email" name="email" type="email" autoComplete="email" maxLength={120} required />
        </div>
      )}
      {conPassword && (
        <div className={css.campo}>
          <label htmlFor="acc-password">{modo === 'nuova' ? 'Nuova password' : 'Password'}</label>
          <input
            id="acc-password"
            name="password"
            type="password"
            autoComplete={modo === 'accedi' ? 'current-password' : 'new-password'}
            minLength={8}
            maxLength={128}
            required
          />
          {modo !== 'accedi' && <span className={css.aiuto}>Almeno 8 caratteri.</span>}
        </div>
      )}
      {ripetiPassword && (
        <div className={css.campo}>
          <label htmlFor="acc-ripeti">Ripeti la password</label>
          <input
            id="acc-ripeti"
            name="ripeti"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            required
          />
        </div>
      )}
      {modo === 'registrati' && (
        <label className={css.consenso}>
          <input name="privacy" value="si" type="checkbox" required />
          <span>
            Ho letto l'
            <a href="/privacy" target="_blank" rel="noopener">
              informativa sulla privacy
            </a>
            .
          </span>
        </label>
      )}
      <button type="submit" className="pulsante" disabled={occupato}>
        {occupato ? 'Un attimo…' : testoPulsante}
      </button>
      <p role="status" className={esito.tipo === 'errore' ? css.errore : css.messaggio}>
        {esito.tipo === 'errore' ? esito.testo : esito.tipo === 'ok' ? esito.testo : ''}
      </p>
      {emailDaConfermare && (
        <button type="button" className={css.rimanda} onClick={rimandaConferma}>
          Rimandami l'email di conferma
        </button>
      )}
    </form>
  );
}

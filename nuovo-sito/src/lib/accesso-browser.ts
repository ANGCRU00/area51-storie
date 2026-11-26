/* Chiamate dal browser a Better Auth (/api/accesso), con i messaggi d'errore tradotti in italiano.
   Usate dai moduli di accesso e dalla sezione "I miei dati" dell'account. */
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
  INVALID_PASSWORD: 'La password attuale non è corretta.',
  CREDENTIAL_ACCOUNT_NOT_FOUND: 'Questo account non ha una password: chiedi in negozio.',
  SESSION_EXPIRED: 'Per sicurezza esci e accedi di nuovo, poi riprova.',
  INVALID_TOKEN: 'Il link non è più valido: chiedi un nuovo link per la password.',
};

export async function chiamaAccesso(percorso: string, dati: Record<string, unknown>) {
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

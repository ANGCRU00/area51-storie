/* Chiamate dal browser alle interfacce /api/gestore/*: restituiscono il JSON o lanciano un errore con il messaggio
   del server (in italiano). Senza accesso da gestore si torna alla pagina di accesso. */
export async function chiamaGestore<T>(
  percorso: string,
  metodo: 'GET' | 'PATCH' = 'GET',
  corpo?: object,
): Promise<T> {
  const risposta = await fetch('/api/gestore/' + percorso, {
    method: metodo,
    headers: corpo ? { 'content-type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (risposta.status === 401) {
    location.href = '/accedi?torna=/gestore';
    throw new Error('Accesso richiesto.');
  }
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) throw new Error(dati.errore ?? 'Operazione non riuscita: riprova.');
  return dati as T;
}

export const dataBreve = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

export const euro = (prezzo: number | null) =>
  prezzo == null ? '' : prezzo.toFixed(2).replace('.', ',') + ' €';

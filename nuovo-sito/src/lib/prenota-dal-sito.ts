/* Usato dai pulsanti "Prenota" (schede, scheda prodotto, home): chiede la prenotazione al server.
   Senza account porta alla pagina di accesso e poi riporta qui. */
export type EsitoPrenota = { ok: boolean; messaggio: string };

export async function prenotaDalSito(codice: string, copie = 1): Promise<EsitoPrenota> {
  const risposta = await fetch('/api/prenotazioni', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ codice, copie }),
  });
  if (risposta.status === 401) {
    location.href = '/accedi?torna=' + encodeURIComponent(location.pathname + location.search);
    return { ok: false, messaggio: '' };
  }
  const corpo = await risposta.json().catch(() => ({}));
  if (!risposta.ok) return { ok: false, messaggio: corpo.errore ?? 'Prenotazione non riuscita: riprova.' };
  return { ok: true, messaggio: 'Prenotato ✓' };
}

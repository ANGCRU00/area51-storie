/* Invio delle email con Resend (https://resend.com). Chiave nel segreto RESEND_API_KEY, mittente in EMAIL_MITTENTE.
   Senza chiave (in sviluppo) l'email non parte: si stampa nel terminale di wrangler/astro, così si possono provare i flussi. */
import { env } from 'cloudflare:workers';

export type Email = { a: string; oggetto: string; testo: string; html: string };

const variabili = env as unknown as { RESEND_API_KEY?: string; EMAIL_MITTENTE?: string };

export async function inviaEmail(email: Email): Promise<void> {
  if (!variabili.RESEND_API_KEY) {
    console.log(
      `\n[email non inviata: manca RESEND_API_KEY]\nA: ${email.a}\nOggetto: ${email.oggetto}\n${email.testo}\n`,
    );
    return;
  }
  const risposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${variabili.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: variabili.EMAIL_MITTENTE ?? 'Area 51 Fumetteria <onboarding@resend.dev>',
      to: [email.a],
      subject: email.oggetto,
      text: email.testo,
      html: email.html,
    }),
  });
  if (!risposta.ok) console.log(`Invio email non riuscito: HTTP ${risposta.status}`);
}

const protetto = (testo: string) =>
  testo.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** Email semplice nello stile del negozio: titolo, paragrafi e, se serve, un pulsante. */
export function componiEmail(
  titolo: string,
  paragrafi: string[],
  pulsante?: { testo: string; indirizzo: string },
) {
  const testo = [
    titolo,
    '',
    ...paragrafi,
    ...(pulsante ? ['', `${pulsante.testo}: ${pulsante.indirizzo}`] : []),
    '',
    'Area 51 Fumetteria · Viale G. Falcone e P. Borsellino, 35 · Barletta',
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#140C2B">
  <h1 style="font-size:22px;margin:0 0 16px">${protetto(titolo)}</h1>
  ${paragrafi.map((p) => `<p style="font-size:15px;line-height:1.5;margin:0 0 12px">${protetto(p)}</p>`).join('\n  ')}
  ${pulsante ? `<p style="margin:24px 0"><a href="${protetto(pulsante.indirizzo)}" style="background:#B9E62E;color:#000;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">${protetto(pulsante.testo)}</a></p>` : ''}
  <p style="font-size:12px;color:#5d567a;margin-top:28px">Area 51 Fumetteria · Viale G. Falcone e P. Borsellino, 35 · Barletta</p>
</div>`;
  return { testo, html };
}

/* POST /api/chiedicelo: salva una richiesta "Chiedicelo" (pagina /negozio).
   Chi può usarla: CHIUNQUE (interfaccia pubblica). Può solo aggiungere una richiesta, non leggerne.
   Difese: campi controllati e accorciati, consenso privacy obbligatorio, campo trappola per i programmi automatici,
   al massimo 3 richieste all'ora per la stessa email. */
import type { APIRoute } from 'astro';
import { and, count, eq, gt } from 'drizzle-orm';
import { db, richieste } from '../../db';
import { emailValida, errore, json, leggiJson, testo } from '../../lib/api';

export const prerender = false;

const CATEGORIE = [
  'Manga e fumetti',
  'TCG',
  'Giochi da tavolo',
  'Giochi di ruolo',
  'Figure e Funko',
  'Warhammer',
  'Gadget',
];

export const POST: APIRoute = async ({ request }) => {
  const d = await leggiJson(request);
  if (!d) return errore('Richiesta non valida.');

  // campo trappola: le persone non lo vedono, i programmi automatici lo riempiono. Si risponde "ok" senza salvare.
  if (testo(d.sito, 100)) return json({ ok: true });

  const cosa = testo(d.cosa, 300);
  const nome = testo(d.nome, 40);
  const email = testo(d.email, 80).toLowerCase();
  const telefono = testo(d.telefono, 20).replace(/[^\d+ ]/g, '');
  const categoria = CATEGORIE.includes(testo(d.categoria, 40)) ? testo(d.categoria, 40) : null;

  if (cosa.length < 3) return errore('Scrivi cosa cerchi (almeno 3 caratteri).');
  if (!nome) return errore('Scrivi il tuo nome.');
  if (!emailValida(email)) return errore("Controlla l'indirizzo email.");
  if (d.privacy !== true)
    return errore('Serve il consenso al trattamento dei dati per rispondere alla richiesta.');

  const unOraFa = new Date(Date.now() - 3600_000).toISOString().slice(0, 19) + 'Z';
  const [recenti] = await db()
    .select({ n: count() })
    .from(richieste)
    .where(and(eq(richieste.email, email), gt(richieste.creataIl, unOraFa)));
  if ((recenti?.n ?? 0) >= 3)
    return errore("Hai già inviato diverse richieste: riprova tra un'ora o chiamaci allo 0883 884567.", 429);

  await db()
    .insert(richieste)
    .values({ cosa, categoria, nome, email, telefono: telefono || null });
  return json({ ok: true }, 201);
};

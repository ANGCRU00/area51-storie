/* Foto del profilo: un JPEG quadrato già ridotto dal browser, salvato in R2 come "profili/<utente>-<istante>.jpg".
   La chiave sta in utenti.immagine. Si accetta solo una chiave con l'id dell'utente: la colonna si può scrivere anche
   da Better Auth (update-user), quindi non ci si fida del valore senza controllarlo. */
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, utenti } from '../db';

export const DIMENSIONE_MASSIMA = 200_000;

const perNomeFile = (utenteId: string) => utenteId.replace(/[^A-Za-z0-9]/g, '');

const eJpeg = (dati: Uint8Array) => dati[0] === 0xff && dati[1] === 0xd8 && dati[2] === 0xff;

export const chiaveDellUtente = (utenteId: string, chiave: string | null | undefined): chiave is string =>
  !!chiave && new RegExp(`^profili/${perNomeFile(utenteId)}-[0-9]{13}[.]jpg$`).test(chiave);

export async function chiaveFotoDi(utenteId: string): Promise<string | null> {
  const [u] = await db().select({ image: utenti.image }).from(utenti).where(eq(utenti.id, utenteId)).limit(1);
  return chiaveDellUtente(utenteId, u?.image) ? u.image : null;
}

export async function leggiFoto(utenteId: string) {
  const chiave = await chiaveFotoDi(utenteId);
  return chiave ? env.FILE.get(chiave) : null;
}

export type EsitoFoto = { ok: true; chiave: string } | { ok: false; errore: string };

export async function salvaFoto(utenteId: string, dati: Uint8Array): Promise<EsitoFoto> {
  if (dati.byteLength > DIMENSIONE_MASSIMA) return { ok: false, errore: "L'immagine è troppo grande." };
  if (!eJpeg(dati)) return { ok: false, errore: "Il file non è un'immagine JPEG." };

  const precedente = await chiaveFotoDi(utenteId);
  const chiave = `profili/${perNomeFile(utenteId)}-${Date.now()}.jpg`;
  await env.FILE.put(chiave, dati, { httpMetadata: { contentType: 'image/jpeg' } });
  await db().update(utenti).set({ image: chiave, updatedAt: new Date() }).where(eq(utenti.id, utenteId));
  if (precedente) await env.FILE.delete(precedente);
  return { ok: true, chiave };
}

export async function togliFoto(utenteId: string) {
  const chiave = await chiaveFotoDi(utenteId);
  await db().update(utenti).set({ image: null, updatedAt: new Date() }).where(eq(utenti.id, utenteId));
  if (chiave) await env.FILE.delete(chiave);
}

/** Per l'eliminazione dell'account: cancella il file solo se la chiave è davvero una foto di quell'utente. */
export async function cancellaFileFoto(utenteId: string, chiave: string | null | undefined) {
  if (chiaveDellUtente(utenteId, chiave)) await env.FILE.delete(chiave);
}

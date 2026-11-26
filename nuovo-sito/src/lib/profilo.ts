/* Dati del profilo del cliente: nome e telefono (l'email resta quella confermata alla registrazione). */
import { eq } from 'drizzle-orm';
import { db, utenti } from '../db';

export type Profilo = { nome: string; email: string; telefono: string };

export const telefonoValido = (telefono: string) =>
  /^\+?[0-9 ]+$/.test(telefono) && /^\d{6,20}$/.test(telefono.replace(/\D/g, ''));

export async function profiloDi(utenteId: string): Promise<Profilo | null> {
  const [u] = await db()
    .select({ nome: utenti.name, email: utenti.email, telefono: utenti.telefono })
    .from(utenti)
    .where(eq(utenti.id, utenteId))
    .limit(1);
  return u ? { ...u, telefono: u.telefono ?? '' } : null;
}

export async function aggiornaProfilo(utenteId: string, nome: string, telefono: string) {
  await db()
    .update(utenti)
    .set({ name: nome, telefono: telefono || null, updatedAt: new Date() })
    .where(eq(utenti.id, utenteId));
  return profiloDi(utenteId);
}

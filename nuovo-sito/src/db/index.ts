/* Accesso al database dal codice del sito (pagine con prerender = false e interfacce /api). */
import { drizzle } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';
import * as schema from './schema';

export const db = () => drizzle(env.DB, { schema });
export * from './schema';

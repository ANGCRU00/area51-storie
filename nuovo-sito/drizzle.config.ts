// Drizzle Kit: genera le migrazioni SQL di D1 (cartella migrazioni/) dalle tabelle in src/db/schema.ts.
// Le applica Wrangler: `npx wrangler d1 migrations apply area51 --local` (o --remote).
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrazioni',
});

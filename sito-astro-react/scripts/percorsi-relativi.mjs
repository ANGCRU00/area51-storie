/* Dopo "astro build": rende relativi i percorsi "/_astro/..." delle pagine, così la cartella dist si apre anche
   fuori dalla radice di un dominio (anteprima, pagina condivisa). */
import fs from 'node:fs';
import path from 'node:path';
const DIST = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../dist');
for (const f of fs.readdirSync(DIST).filter((x) => x.endsWith('.html'))) {
  const p = path.join(DIST, f);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/(["'(])\/_astro\//g, '$1./_astro/'));
}
console.log('percorsi relativi pronti');

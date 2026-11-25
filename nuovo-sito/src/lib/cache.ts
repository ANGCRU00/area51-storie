/** Pagine scritte a ogni richiesta: il browser non le tiene (così un cambio del gestore si vede subito),
 *  la rete di Cloudflare può tenerle un minuto. Variano con i cookie (conferma dell'età). */
export function impostaCachePaginaDinamica(intestazioni: Headers) {
  intestazioni.set('cache-control', 'public, max-age=0, s-maxage=60');
  intestazioni.set('vary', 'cookie');
}

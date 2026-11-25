/* Dati del visitatore su QUESTO dispositivo: carrello e preferiti (localStorage).
   Stesse chiavi del sito attuale (js/area51.js), così chi passa dal vecchio al nuovo sito ritrova il carrello.
   Quando ci saranno gli account (fase 5) il carrello di chi ha fatto l'accesso si salverà anche in D1. */

export type Riga = {
  k: string;
  t: string;
  p: number;
  l: string;
  i: string;
  e: string;
  d?: string;
  q: number;
};
export type Preferito = { k: string; t: string; p: number; l: string; i: string; e: string };

const CH = { carrello: 'area51-carrello', preferiti: 'area51-preferiti', serie: 'area51-serie' } as const;
const memoria: Record<string, unknown> = {};
const ascoltatori = new Set<() => void>();

function leggi<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(k);
    if (v) return JSON.parse(v) as T;
  } catch {
    if (memoria[k] !== undefined) return memoria[k] as T;
  }
  return def;
}
function scrivi(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    memoria[k] = v;
  }
  avvisa();
}
function avvisa() {
  ascoltatori.forEach((f) => {
    try {
      f();
    } catch {
      /* un ascoltatore rotto non ferma gli altri */
    }
  });
}

if (typeof window !== 'undefined') {
  // un'altra scheda del browser ha cambiato carrello o preferiti
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('area51-')) avvisa();
  });
}

/** Per useSyncExternalStore: si iscrive ai cambiamenti e restituisce la funzione per disiscriversi. */
export function ascolta(f: () => void) {
  ascoltatori.add(f);
  return () => {
    ascoltatori.delete(f);
  };
}

const testo = (x: unknown) => String(x ?? '').slice(0, 200);

export const carrello = {
  tutti: () => leggi<Riga[]>(CH.carrello, []),
  conta: () => leggi<Riga[]>(CH.carrello, []).reduce((t, x) => t + (Number(x.q) || 0), 0),
  aggiungi(s: Omit<Riga, 'q'>, q = 1) {
    const l = leggi<Riga[]>(CH.carrello, []);
    q = Math.max(1, Math.min(9, q));
    const x = l.find((y) => y.k === s.k);
    if (x) x.q = Math.min(9, x.q + q);
    else
      l.push({
        k: testo(s.k),
        t: testo(s.t),
        p: Number(s.p) || 0,
        l: String(s.l ?? '').slice(0, 700),
        i: testo(s.i),
        e: testo(s.e),
        d: testo(s.d),
        q,
      });
    scrivi(CH.carrello, l);
  },
};

export const preferiti = {
  tutti: () => leggi<Preferito[]>(CH.preferiti, []),
  conta: () => leggi<Preferito[]>(CH.preferiti, []).length,
  ha: (k: string) => leggi<Preferito[]>(CH.preferiti, []).some((x) => x.k === k),
  /** aggiunge o toglie dalla lista desideri; restituisce true se ora c'è */
  scambia(s: Preferito): boolean {
    const l = leggi<Preferito[]>(CH.preferiti, []);
    if (l.some((x) => x.k === s.k)) {
      scrivi(
        CH.preferiti,
        l.filter((x) => x.k !== s.k),
      );
      return false;
    }
    l.push({
      k: testo(s.k),
      t: testo(s.t),
      p: Number(s.p) || 0,
      l: String(s.l ?? '').slice(0, 700),
      i: testo(s.i),
      e: testo(s.e),
    });
    scrivi(CH.preferiti, l);
    return true;
  },
};

/* Serie seguite (s = nome della serie, e = editore), come nel sito attuale */
export type SerieSeguita = { s: string; e: string };
const stessa = (x: SerieSeguita, s: string, e: string) => x.s.toLowerCase() === s.toLowerCase() && x.e === e;
export const serie = {
  tutti: () => leggi<SerieSeguita[]>(CH.serie, []),
  ha: (s: string, e: string) => leggi<SerieSeguita[]>(CH.serie, []).some((x) => stessa(x, s, e)),
  /** segue o smette di seguire; restituisce true se ora la segue */
  scambia(s: string, e: string): boolean {
    const l = leggi<SerieSeguita[]>(CH.serie, []);
    if (l.some((x) => stessa(x, s, e))) {
      scrivi(
        CH.serie,
        l.filter((x) => !stessa(x, s, e)),
      );
      return false;
    }
    l.push({ s: testo(s), e: testo(e) });
    scrivi(CH.serie, l);
    return true;
  },
};

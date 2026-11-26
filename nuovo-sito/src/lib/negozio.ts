/* Dati del visitatore su QUESTO dispositivo: preferiti e serie seguite (localStorage).
   Stesse chiavi del sito attuale (js/area51.js), così chi passa dal vecchio al nuovo sito ritrova i preferiti.
   Chi ha fatto l'accesso ritrova preferiti e serie anche sugli altri dispositivi: vedi "Account collegato" in fondo. */

export type Preferito = { k: string; t: string; p: number; l: string; i: string; e: string };

const CH = {
  preferiti: 'area51-preferiti',
  serie: 'area51-serie',
  account: 'area51-account',
  foto: 'area51-foto',
} as const;
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
function rimuovi(k: string) {
  try {
    localStorage.removeItem(k);
  } catch {
    /* localStorage bloccato: resta solo la copia in memoria */
  }
  delete memoria[k];
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
  // un'altra scheda del browser ha cambiato preferiti o serie
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
      mandaAlServer('DELETE', { preferito: s.k });
      return false;
    }
    const nuovo = {
      k: testo(s.k),
      t: testo(s.t),
      p: Number(s.p) || 0,
      l: String(s.l ?? '').slice(0, 700),
      i: testo(s.i),
      e: testo(s.e),
    };
    l.push(nuovo);
    scrivi(CH.preferiti, l);
    mandaAlServer('POST', { preferiti: [nuovo] });
    return true;
  },
};

/* Serie seguite (s = nome della serie, e = editore, c = codice della serie su Starshop se si conosce) */
export type SerieSeguita = { s: string; e: string; c?: string };
const stessa = (x: SerieSeguita, s: string, e: string) => x.s.toLowerCase() === s.toLowerCase() && x.e === e;
export const serie = {
  tutti: () => leggi<SerieSeguita[]>(CH.serie, []),
  ha: (s: string, e: string) => leggi<SerieSeguita[]>(CH.serie, []).some((x) => stessa(x, s, e)),
  /** segue o smette di seguire; restituisce true se ora la segue */
  scambia(s: string, e: string, c = ''): boolean {
    const l = leggi<SerieSeguita[]>(CH.serie, []);
    if (l.some((x) => stessa(x, s, e))) {
      scrivi(
        CH.serie,
        l.filter((x) => !stessa(x, s, e)),
      );
      mandaAlServer('DELETE', { serie: { s, e } });
      return false;
    }
    const nuova: SerieSeguita = { s: testo(s), e: testo(e), ...(c ? { c: testo(c) } : {}) };
    l.push(nuova);
    scrivi(CH.serie, l);
    mandaAlServer('POST', { serie: [nuova] });
    return true;
  },
};

/* ---------- Account collegato ----------
   Dopo l'accesso preferiti e serie vanno anche al server (/api/raccolte). La prima volta su questo dispositivo
   le liste del dispositivo e dell'account si uniscono; poi comanda la copia dell'account.
   All'uscita dall'account le due liste spariscono da questo dispositivo (restano salvate nell'account). */

type Raccolte = { preferiti?: Preferito[]; serie?: SerieSeguita[]; foto?: string };

const idCollegato = () => leggi<string>(CH.account, '');

async function chiamaRaccolte(metodo: 'GET' | 'POST' | 'DELETE', corpo?: object): Promise<Raccolte | null> {
  try {
    const risposta = await fetch('/api/raccolte', {
      method: metodo,
      headers: corpo ? { 'content-type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (risposta.status === 401) {
      scollegaAccount();
      return null;
    }
    return risposta.ok ? ((await risposta.json()) as Raccolte) : null;
  } catch {
    return null;
  }
}

function mandaAlServer(metodo: 'POST' | 'DELETE', corpo: object) {
  if (idCollegato()) void chiamaRaccolte(metodo, corpo);
}

const soloDatiSerie = ({ s, e, c }: SerieSeguita): SerieSeguita => (c ? { s, e, c } : { s, e });

/** Da chiamare dopo l'accesso e nella pagina account: allinea il dispositivo all'account. */
export async function collegaAccount(utenteId: string) {
  const precedente = idCollegato();
  if (precedente && precedente !== utenteId) {
    rimuovi(CH.preferiti);
    rimuovi(CH.serie);
  }
  const giaCollegato = precedente === utenteId;
  const dati = giaCollegato
    ? await chiamaRaccolte('GET')
    : await chiamaRaccolte('POST', { preferiti: preferiti.tutti(), serie: serie.tutti() });
  if (!dati) return;
  if (dati.preferiti) scrivi(CH.preferiti, dati.preferiti);
  if (dati.serie) scrivi(CH.serie, dati.serie.map(soloDatiSerie));
  if (dati.foto !== undefined) impostaFotoProfilo(dati.foto);
  scrivi(CH.account, utenteId);
}

export function scollegaAccount() {
  if (!idCollegato()) return;
  rimuovi(CH.account);
  rimuovi(CH.preferiti);
  rimuovi(CH.serie);
  rimuovi(CH.foto);
}

/** Indirizzo della foto del profilo per la testata ('' = nessuna). La chiave cambia a ogni foto nuova. */
export const indirizzoFotoProfilo = () => {
  const chiave = leggi<string>(CH.foto, '');
  return chiave ? '/api/profilo/foto?v=' + encodeURIComponent(chiave.replace(/^profili\//, '')) : '';
};

export function impostaFotoProfilo(chiave: string) {
  if (chiave) scrivi(CH.foto, chiave);
  else rimuovi(CH.foto);
}

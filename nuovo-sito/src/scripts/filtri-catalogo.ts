/* Filtri del catalogo senza ricaricare la pagina.
 I gestori sono collegati al documento (non ai singoli elementi), così funzionano anche dopo che barra e risultati
 vengono sostituiti. Senza JavaScript il modulo funziona comunque come un normale modulo GET. */
const modulo = () => document.getElementById('modulo-filtri') as HTMLFormElement | null;
const tendine = () => Array.from(document.querySelectorAll<HTMLDetailsElement>('.tendina'));

/* ---------- aggiornamento senza ricaricare la pagina ---------- */
const PARTI = ['#modulo-filtri', '.sopra', '.risultati'];
let ultima = 0;
async function vai(url: string, comeStoria = true, scorri = false) {
  const io = ++ultima;
  document.querySelector('.risultati')?.classList.add('in-caricamento');
  try {
    const r = await fetch(url, { headers: { Accept: 'text/html' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    if (io !== ultima) return; // nel frattempo è partita una richiesta più recente
    for (const sel of PARTI) {
      const vecchio = document.querySelector(sel),
        nuovo = doc.querySelector(sel);
      if (vecchio && nuovo) vecchio.replaceWith(nuovo);
    }
    document.title = doc.title;
    if (comeStoria) history.pushState({ filtri: true }, '', url);
    if (scorri) document.querySelector('.sopra')?.scrollIntoView({ block: 'start' });
  } catch {
    location.href = url; // se qualcosa va storto, si carica la pagina normalmente
  }
}
function indirizzoDalModulo(f: HTMLFormElement) {
  const q = new URLSearchParams();
  for (const [k, v] of new FormData(f).entries()) if (v !== '') q.append(k, String(v));
  const s = q.toString();
  return f.action.split('?')[0] + (s ? '?' + s : '');
}
document.addEventListener('submit', (e) => {
  const f = e.target as HTMLFormElement;
  if (f.id !== 'modulo-filtri') return;
  e.preventDefault();
  vai(indirizzoDalModulo(f));
});
// filtri scelti (etichette), "Azzera tutto" e pagine: stessi aggiornamenti senza ricarica
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('.attivi a, .pagine a');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  vai(a.href, true, !!a.closest('.pagine'));
});
window.addEventListener('popstate', () => vai(location.href, false));

/* ---------- modulo ---------- */
document.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  const f = modulo();
  if (!f || !f.contains(t)) return;
  if (t.matches('[data-casella18]')) {
    // 18+: senza conferma dell'età si chiede prima di applicare
    if (t.checked && !t.dataset.confermata) {
      t.checked = false;
      const c = document.querySelector<HTMLElement>('[data-adulti-conferma]');
      if (c) c.hidden = false;
      return;
    }
    f.requestSubmit();
    return;
  }
  if (t.matches('select, input[type="radio"]')) f.requestSubmit();
});
document.addEventListener('click', (e) => {
  const el = e.target as Element;
  if (el.closest('[data-adulti-si]')) {
    document.cookie = 'area51_adulti=1; path=/; max-age=15552000; samesite=lax';
    const c = document.querySelector<HTMLInputElement>('[data-casella18]');
    if (c) {
      c.dataset.confermata = '1';
      c.checked = true;
    }
    modulo()?.requestSubmit();
  }
  if (el.closest('[data-adulti-annulla]')) {
    const c = document.querySelector<HTMLElement>('[data-adulti-conferma]');
    if (c) c.hidden = true;
    const u = new URL(location.href);
    if (u.searchParams.get('adulti') === '1') {
      u.searchParams.delete('adulti');
      vai(u.toString());
    }
  }
});

/* ---------- tendine: una sola aperta, si chiudono cliccando fuori o con Esc ---------- */
document.addEventListener(
  'toggle',
  (e) => {
    const d = e.target as HTMLDetailsElement;
    if (d.classList?.contains('tendina') && d.open)
      tendine().forEach((x) => {
        if (x !== d) x.open = false;
      });
  },
  true,
);
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.tendina'))
    tendine().forEach((x) => {
      x.open = false;
    });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')
    tendine().forEach((x) => {
      if (x.open) {
        x.open = false;
        x.querySelector('summary')?.focus();
      }
    });
});

/* ---------- ricerca dentro l'elenco degli editori (non invia il modulo) ---------- */
document.addEventListener('input', (e) => {
  const c = e.target as HTMLInputElement;
  if (!c.matches('[data-filtra-editori]')) return;
  const q = c.value.trim().toLowerCase();
  document.querySelectorAll<HTMLLabelElement>('[data-elenco-editori] label').forEach((l) => {
    l.hidden = !!q && !l.textContent!.toLowerCase().includes(q);
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.target as Element).matches?.('[data-filtra-editori]')) e.preventDefault();
});

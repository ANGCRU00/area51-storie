/* Isola: il pulsante del carrello in testata. Si aggiorna da solo quando aggiungi qualcosa, in qualunque parte della pagina. */
import { createSignal, onMount, onCleanup } from 'solid-js';

export default function Carrello() {
  const [n, setN] = createSignal(0);
  onMount(() => {
    const A = (window as any).A51;
    const aggiorna = () => setN(A ? A.carrello.conta() : 0);
    aggiorna();
    if (A) A.onChange(aggiorna);
    window.addEventListener('storage', aggiorna);
    onCleanup(() => window.removeEventListener('storage', aggiorna));
  });
  return (
    <a class="whitespace-nowrap bg-brand-lime text-black font-heavy text-xs px-3.5 sm:px-4 py-3 rounded-full flex items-center gap-2 shadow-brutal-violet" href="carrello.html" aria-label={`Carrello, ${n()} prodotti`}>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" /></svg>
      <span class="hidden sm:inline">Carrello · {n()}</span><span class="sm:hidden">{n()}</span>
    </a>
  );
}

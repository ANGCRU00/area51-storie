/* Isola (React): il pulsante del carrello in testata. Si aggiorna da solo quando aggiungi qualcosa, in qualunque parte della pagina. */
import { useEffect, useState } from 'react';

export default function Carrello() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const A = (window as any).A51;
    const aggiorna = () => setN(A ? A.carrello.conta() : 0);
    aggiorna();
    if (A) A.onChange(aggiorna);
    window.addEventListener('storage', aggiorna);
    return () => window.removeEventListener('storage', aggiorna);
  }, []);
  return (
    <a className="whitespace-nowrap bg-brand-lime text-black font-heavy text-xs px-3.5 sm:px-4 py-3 rounded-full flex items-center gap-2 shadow-brutal-violet" href="carrello.html" aria-label={`Carrello, ${n} prodotti`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
      <span className="hidden sm:inline">Carrello · {n}</span><span className="sm:hidden">{n}</span>
    </a>
  );
}

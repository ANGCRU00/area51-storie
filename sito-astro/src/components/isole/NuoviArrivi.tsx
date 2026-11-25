/* Isola: i due pulsanti "Nuovi arrivi / Prossime uscite" e le schede.
   Le schede arrivano già calcolate dalla costruzione del sito (props); qui c'è solo ciò che risponde ai tocchi:
   cambio di elenco, apertura del modale del prodotto, "Aggiungi al carrello" / "Prenota". */
import { createSignal, For, Show } from 'solid-js';

type Scheda = { ean: string; titolo: string; editore: string; prezzo: number; quando: string; pre: boolean };

const ON = 'bg-brand-lime text-black font-heavy text-sm px-5 py-2.5 rounded-full shadow-brutal-violet';
const OFF = 'bg-[#120a2e] hover:text-brand-lime border border-white/15 hover:border-brand-lime font-semibold text-sm px-5 py-2.5 rounded-full transition-colors';
const euro = (x: number) => x.toFixed(2).replace('.', ',') + ' €';

export default function NuoviArrivi(props: { nuovi: Scheda[]; prossime: Scheda[] }) {
  const [tipo, setTipo] = createSignal<'nuovi' | 'prossime'>('nuovi');
  const [aggiunto, setAggiunto] = createSignal('');
  const elenco = () => (tipo() === 'nuovi' ? props.nuovi : props.prossime);

  function apri(e: MouseEvent, ean: string) {
    const w = window as any;
    if (typeof w.apriProdotto === 'function' && w.apriProdotto(ean)) e.preventDefault();   // modale del sito attuale
  }
  function aggiungi(s: Scheda) {
    const A = (window as any).A51; if (!A) return;
    A.carrello.aggiungi({ k: s.ean, t: s.titolo, p: s.prezzo, l: 'prodotto.html?cat=catalogo&ean=' + s.ean, i: 'img/copertine/' + s.ean + '.webp', e: s.editore, d: s.pre ? 'Preordine' : '' }, 1);
    setAggiunto(s.ean); setTimeout(() => setAggiunto(''), 1800);
  }

  return (
    <>
      <div class="flex flex-wrap gap-2.5 mb-6 lg:mb-8" role="group" aria-label="Scegli cosa vedere">
        <button type="button" aria-pressed={tipo() === 'nuovi'} class={tipo() === 'nuovi' ? ON : OFF} onClick={() => setTipo('nuovi')}>Nuovi arrivi</button>
        <button type="button" aria-pressed={tipo() === 'prossime'} class={tipo() === 'prossime' ? ON : OFF} onClick={() => setTipo('prossime')}>Prossime uscite</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 w-[90%] mx-auto min-h-[20rem]">
        <For each={elenco()}>{(s, i) => {
          const link = 'prodotto.html?cat=catalogo&ean=' + s.ean;
          return (
            <article class={(i() >= 4 ? 'max-sm:hidden ' : '') + 'bg-[#0e0926]/90 rounded-2xl border border-white/10 p-3 hover:border-brand-lime transition-colors flex flex-col justify-between group'}>
              <a href={link} class="block" onClick={(e) => apri(e, s.ean)}>
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-[#120a2e]">
                  <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={'img/copertine/' + s.ean + '.webp'} alt={'Copertina di ' + s.titolo} width="220" height="320" loading="lazy" decoding="async" />
                  <span class={'absolute top-2 left-2 ' + (s.pre ? 'bg-brand-violet text-white' : 'bg-brand-lime text-black') + ' font-heavy text-[10px] px-2.5 py-0.5 rounded -rotate-2'}>{s.pre ? 'PREORDINE' : 'NOVITÀ'}</span>
                </div>
                <p class="text-[11px] font-bold text-brand-muted tracking-wider uppercase">{s.editore}</p>
                <h3 class="font-heavy text-sm sm:text-base text-white mt-1 leading-snug group-hover:text-brand-lime transition-colors">{s.titolo}</h3>
                <p class="mt-1.5 text-[11px] sm:text-xs font-semibold text-brand-muted">{s.quando}</p>
              </a>
              <div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
                <span class="font-heavy text-sm sm:text-base text-brand-lime">{euro(s.prezzo)}</span>
                <button type="button" onClick={() => aggiungi(s)}
                  class={(s.pre ? 'bg-brand-violet hover:bg-brand-violetGlow text-white rounded-bl-[4px] shadow-[3px_3px_0_#B9E62E]' : 'hover:bg-brand-lime hover:text-black border border-white/25 hover:border-brand-lime rounded-bl-[4px] shadow-[3px_3px_0_#5B21B6]') + ' font-heavy text-xs px-3.5 py-2 rounded-full transition-colors'}>
                  <Show when={aggiunto() === s.ean} fallback={s.pre ? 'Prenota' : 'Aggiungi'}>Aggiunto ✓</Show>
                </button>
              </div>
            </article>
          );
        }}</For>
      </div>
    </>
  );
}

/* Pagina account: cambia o togli la foto del profilo. L'immagine si ritaglia quadrata e si riduce a 256 px
   nel browser, poi va al server già come JPEG piccolo (/api/profilo/foto). */
import { impostaFotoProfilo, indirizzoFotoProfilo } from '../lib/negozio';

const LATO = 256;
const MEGA = 1024 * 1024;
const PESO_MASSIMO = 200_000;

const riquadro = document.querySelector<HTMLElement>('[data-foto-profilo]');
const immagine = riquadro?.querySelector('img');
const scelta = document.getElementById('scegli-foto') as HTMLInputElement | null;
const togli = document.getElementById('togli-foto') as HTMLButtonElement | null;
const messaggio = document.getElementById('messaggio-foto');

function avvisa(testo: string, errore = false) {
  if (!messaggio) return;
  messaggio.textContent = testo;
  messaggio.classList.toggle('errore', errore);
}

function mostra() {
  const indirizzo = indirizzoFotoProfilo();
  if (immagine && indirizzo) immagine.src = indirizzo;
  riquadro?.classList.toggle('con-foto', !!indirizzo);
  if (togli) togli.hidden = !indirizzo;
}

async function riduci(file: File): Promise<Blob> {
  const originale = await createImageBitmap(file);
  const lato = Math.min(originale.width, originale.height);
  const tela = document.createElement('canvas');
  tela.width = tela.height = LATO;
  tela
    .getContext('2d')
    ?.drawImage(
      originale,
      (originale.width - lato) / 2,
      (originale.height - lato) / 2,
      lato,
      lato,
      0,
      0,
      LATO,
      LATO,
    );
  for (const qualita of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((fatto) => tela.toBlob(fatto, 'image/jpeg', qualita));
    if (blob && blob.size <= PESO_MASSIMO) return blob;
  }
  throw new Error("Non riesco a ridurre abbastanza l'immagine: provane un'altra.");
}

scelta?.addEventListener('change', async () => {
  const file = scelta.files?.[0];
  scelta.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) return avvisa('Scegli un file immagine (JPG, PNG, WebP…).', true);
  if (file.size > 15 * MEGA) return avvisa("L'immagine supera 15 MB: scegline una più leggera.", true);
  avvisa('Carico la foto…');
  try {
    const risposta = await fetch('/api/profilo/foto', {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
      body: await riduci(file),
    });
    const corpo = await risposta.json().catch(() => ({}));
    if (!risposta.ok) throw new Error(corpo.errore ?? 'Caricamento non riuscito: riprova.');
    impostaFotoProfilo(corpo.foto);
    mostra();
    avvisa('Foto aggiornata.');
  } catch (e) {
    avvisa((e as Error).message || "Questa immagine non si può usare: provane un'altra.", true);
  }
});

togli?.addEventListener('click', async () => {
  const risposta = await fetch('/api/profilo/foto', { method: 'DELETE' });
  if (!risposta.ok) return avvisa('Non sono riuscito a togliere la foto: riprova.', true);
  impostaFotoProfilo('');
  mostra();
  avvisa('Foto tolta.');
});

if (riquadro?.dataset.fotoProfilo !== undefined) {
  impostaFotoProfilo(riquadro.dataset.fotoProfilo);
  mostra();
}

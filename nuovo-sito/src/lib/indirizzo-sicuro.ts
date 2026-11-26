/** Pagina a cui tornare dopo l'accesso: solo percorsi interni al sito (niente "//altrosito" o indirizzi esterni). */
export function percorsoInterno(valore: string | null, predefinito = '/account'): string {
  if (!valore || !valore.startsWith('/') || valore.startsWith('//') || valore.includes('\\'))
    return predefinito;
  return valore.slice(0, 300);
}

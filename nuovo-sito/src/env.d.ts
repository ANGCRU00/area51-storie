declare namespace App {
  interface Locals {
    utente: import('./lib/accesso').UtenteConnesso | null;
  }
}

-- Richieste "Chiedicelo" dalla pagina /negozio: un cliente chiede un prodotto che non trova.
-- Le legge solo il gestore (area gestore, fase 7). Dati personali minimi, cancellabili su richiesta.
CREATE TABLE IF NOT EXISTS richieste (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cosa TEXT NOT NULL CHECK (length(cosa) BETWEEN 3 AND 300),
  categoria TEXT,
  nome TEXT NOT NULL CHECK (length(nome) BETWEEN 1 AND 40),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 5 AND 80),
  telefono TEXT,
  stato TEXT NOT NULL DEFAULT 'nuova' CHECK (stato IN ('nuova', 'in_lavorazione', 'evasa', 'non_disponibile')),
  creata_il TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS richieste_stato ON richieste (stato, creata_il);

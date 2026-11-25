-- Tabella di prova della fase 1: serve solo a controllare che il sito legga e scriva D1.
-- Le tabelle vere arrivano nella fase 3 (Drizzle).
CREATE TABLE IF NOT EXISTS prova (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nota TEXT NOT NULL,
  creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO prova (nota) VALUES ('D1 collegato');

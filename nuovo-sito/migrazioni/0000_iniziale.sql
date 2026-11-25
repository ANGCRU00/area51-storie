CREATE TABLE `articoli` (
	`id` text PRIMARY KEY NOT NULL,
	`codice_starshop` text NOT NULL,
	`ean` text,
	`ean_alt` text DEFAULT '[]' NOT NULL,
	`titolo` text NOT NULL,
	`autore` text,
	`editore` text,
	`codice_editore` text,
	`codice_padre` text,
	`numero` integer,
	`prezzo_listino` real,
	`lingua` text,
	`pagine` integer,
	`data_uscita` text,
	`categoria` text,
	`sotto_categoria` text,
	`copertina` text,
	`stato` text DEFAULT 'annunciato' NOT NULL,
	`data_arrivo` text,
	`esaurito_fornitore` integer,
	`visibile` integer DEFAULT false NOT NULL,
	`fonte` text DEFAULT 'starshop' NOT NULL,
	`creato_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	`aggiornato_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	CONSTRAINT "articoli_stato_valido" CHECK("articoli"."stato" IN ('annunciato', 'appena_arrivato', 'disponibile', 'esaurito', 'da_verificare'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articoli_codice_starshop_unique` ON `articoli` (`codice_starshop`);--> statement-breakpoint
CREATE INDEX `articoli_ean` ON `articoli` (`ean`);--> statement-breakpoint
CREATE INDEX `articoli_stato` ON `articoli` (`stato`);--> statement-breakpoint
CREATE TABLE `richieste` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cosa` text NOT NULL,
	`categoria` text,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`telefono` text,
	`stato` text DEFAULT 'nuova' NOT NULL,
	`creata_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	CONSTRAINT "richieste_lunghezze" CHECK(length("richieste"."cosa") BETWEEN 3 AND 300 AND length("richieste"."nome") BETWEEN 1 AND 40 AND length("richieste"."email") BETWEEN 5 AND 80)
);
--> statement-breakpoint
CREATE INDEX `richieste_stato` ON `richieste` (`stato`,`creata_il`);--> statement-breakpoint
CREATE INDEX `richieste_email` ON `richieste` (`email`,`creata_il`);--> statement-breakpoint
CREATE TABLE `uscite` (
	`id` text PRIMARY KEY NOT NULL,
	`riferimento_esterno` text,
	`ean` text,
	`titolo` text NOT NULL,
	`serie` text,
	`numero` text,
	`editore` text,
	`prezzo` real,
	`data_uscita` text,
	`data_limite` text,
	`copertina` text,
	`categoria` text,
	`fonte` text DEFAULT 'manuale' NOT NULL,
	`visibile` integer DEFAULT true NOT NULL,
	`creato_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	`aggiornato_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	CONSTRAINT "uscite_categoria_valida" CHECK("uscite"."categoria" IS NULL OR "uscite"."categoria" IN ('manga', 'fumetti', 'tcg', 'giochi'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uscite_riferimento_esterno_unique` ON `uscite` (`riferimento_esterno`);--> statement-breakpoint
CREATE INDEX `uscite_data` ON `uscite` (`data_uscita`);--> statement-breakpoint
CREATE INDEX `uscite_categoria` ON `uscite` (`categoria`);--> statement-breakpoint
CREATE INDEX `uscite_editore` ON `uscite` (`editore`);
CREATE TABLE `preferiti` (
	`utente_id` text NOT NULL,
	`codice` text NOT NULL,
	`titolo` text NOT NULL,
	`prezzo` real,
	`indirizzo` text NOT NULL,
	`copertina` text DEFAULT '' NOT NULL,
	`editore` text DEFAULT '' NOT NULL,
	`creato_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	PRIMARY KEY(`utente_id`, `codice`),
	FOREIGN KEY (`utente_id`) REFERENCES `utenti`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `serie_seguite` (
	`utente_id` text NOT NULL,
	`nome` text NOT NULL,
	`editore` text DEFAULT '' NOT NULL,
	`codice_serie` text,
	`creata_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	PRIMARY KEY(`utente_id`, `nome`, `editore`),
	FOREIGN KEY (`utente_id`) REFERENCES `utenti`(`id`) ON UPDATE no action ON DELETE cascade
);

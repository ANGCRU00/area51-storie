CREATE TABLE `credenziali` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`fornitore` text NOT NULL,
	`utente_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_scade_il` integer,
	`refresh_token_scade_il` integer,
	`scope` text,
	`password` text,
	`creata_il` integer NOT NULL,
	`aggiornata_il` integer NOT NULL,
	FOREIGN KEY (`utente_id`) REFERENCES `utenti`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credenziali_utente` ON `credenziali` (`utente_id`);--> statement-breakpoint
CREATE TABLE `prenotazioni` (
	`id` text PRIMARY KEY NOT NULL,
	`utente_id` text NOT NULL,
	`uscita_id` text,
	`codice_prodotto` text NOT NULL,
	`titolo` text NOT NULL,
	`copie` integer DEFAULT 1 NOT NULL,
	`stato` text DEFAULT 'richiesta' NOT NULL,
	`nota_cliente` text,
	`creata_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	`aggiornata_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	FOREIGN KEY (`utente_id`) REFERENCES `utenti`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uscita_id`) REFERENCES `uscite`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "prenotazioni_copie" CHECK("prenotazioni"."copie" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX `prenotazioni_utente` ON `prenotazioni` (`utente_id`,`creata_il`);--> statement-breakpoint
CREATE INDEX `prenotazioni_stato` ON `prenotazioni` (`stato`);--> statement-breakpoint
CREATE TABLE `sessioni` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`utente_id` text NOT NULL,
	`scade_il` integer NOT NULL,
	`indirizzo_ip` text,
	`browser` text,
	`creata_il` integer NOT NULL,
	`aggiornata_il` integer NOT NULL,
	FOREIGN KEY (`utente_id`) REFERENCES `utenti`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessioni_token_unique` ON `sessioni` (`token`);--> statement-breakpoint
CREATE INDEX `sessioni_utente` ON `sessioni` (`utente_id`);--> statement-breakpoint
CREATE TABLE `utenti` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`email_verificata` integer DEFAULT false NOT NULL,
	`immagine` text,
	`ruolo` text DEFAULT 'cliente' NOT NULL,
	`telefono` text,
	`creato_il` integer NOT NULL,
	`aggiornato_il` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `utenti_email_unique` ON `utenti` (`email`);--> statement-breakpoint
CREATE TABLE `verifiche` (
	`id` text PRIMARY KEY NOT NULL,
	`identificativo` text NOT NULL,
	`valore` text NOT NULL,
	`scade_il` integer NOT NULL,
	`creata_il` integer NOT NULL,
	`aggiornata_il` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifiche_identificativo` ON `verifiche` (`identificativo`);
CREATE TABLE `serie` (
	`chiave` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`generi` text DEFAULT '[]' NOT NULL,
	`adulti` integer DEFAULT false NOT NULL,
	`fonte` text DEFAULT 'nessuna' NOT NULL,
	`anilist_id` integer,
	`anilist_titolo` text,
	`anilist_generi` text,
	`somiglianza` real,
	`confermata` integer DEFAULT false NOT NULL,
	`aggiornata_il` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `serie_adulti` ON `serie` (`adulti`);
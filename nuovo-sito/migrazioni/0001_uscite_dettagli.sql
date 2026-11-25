ALTER TABLE `uscite` ADD `autore` text;--> statement-breakpoint
ALTER TABLE `uscite` ADD `pagine` integer;--> statement-breakpoint
ALTER TABLE `uscite` ADD `lingua` text;--> statement-breakpoint
ALTER TABLE `uscite` ADD `codice_padre` text;--> statement-breakpoint
CREATE INDEX `uscite_serie` ON `uscite` (`codice_padre`);
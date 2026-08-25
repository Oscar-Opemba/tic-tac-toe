CREATE TABLE `player_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(24) NOT NULL,
	`avatar` varchar(16) NOT NULL DEFAULT 'TARGET',
	`cardColor` varchar(16) NOT NULL DEFAULT 'VERMILION',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_profiles_playerName_unique` UNIQUE(`playerName`)
);
--> statement-breakpoint
ALTER TABLE `match_history` ADD `seasonKey` varchar(16) DEFAULT 'ARCHIVE' NOT NULL;--> statement-breakpoint
CREATE INDEX `match_history_season_idx` ON `match_history` (`seasonKey`,`playedAt`);
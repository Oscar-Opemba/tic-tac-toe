CREATE TABLE `match_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(24) NOT NULL,
	`opponentName` varchar(24) NOT NULL,
	`outcome` enum('wins','losses','draws') NOT NULL,
	`gameMode` enum('LOCAL','AI') NOT NULL,
	`difficulty` enum('LOCAL','EASY','HARD') NOT NULL,
	`playedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `match_history_player_played_idx` ON `match_history` (`playerName`,`playedAt`);--> statement-breakpoint
CREATE INDEX `match_history_played_idx` ON `match_history` (`playedAt`);
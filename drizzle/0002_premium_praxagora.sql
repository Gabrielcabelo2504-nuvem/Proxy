CREATE TABLE `resellers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`commissionPercentage` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resellers_id` PRIMARY KEY(`id`),
	CONSTRAINT `resellers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD `resellerId` int;
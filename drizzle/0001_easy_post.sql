CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`clientName` varchar(160) NOT NULL,
	`authorizedIp` varchar(64),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`lastAccessAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `key_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`previousIp` varchar(64),
	`newIp` varchar(64),
	`actorIp` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `key_activity_logs_id` PRIMARY KEY(`id`)
);

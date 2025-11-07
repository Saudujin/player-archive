CREATE TABLE `admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_username_unique` UNIQUE(`username`)
);

CREATE TABLE `playerImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`thumbnailUrl` text,
	`thumbnailKey` varchar(512),
	`caption` text,
	`isUpscaled` boolean DEFAULT false,
	`originalImageId` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`uploadedBy` int NOT NULL,
	CONSTRAINT `playerImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameArabic` varchar(255) NOT NULL,
	`nameEnglish` varchar(255) NOT NULL,
	`alternativeNames` text,
	`keywords` text,
	`coverImageUrl` text,
	`coverImageKey` varchar(512),
	`teamName` varchar(255),
	`position` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int NOT NULL,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vectorLogos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`originalImageId` int NOT NULL,
	`svgUrl` text NOT NULL,
	`svgKey` varchar(512) NOT NULL,
	`pdfUrl` text,
	`pdfKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `vectorLogos_id` PRIMARY KEY(`id`)
);

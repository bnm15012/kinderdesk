CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` varchar(50) NOT NULL DEFAULT '₹0',
	`period` varchar(50) NOT NULL DEFAULT 'forever',
	`currency` varchar(10) DEFAULT 'INR',
	`description` text,
	`features` text DEFAULT ('[]'),
	`featured` int DEFAULT 0,
	`display_order` int DEFAULT 0,
	`status` enum('active','inactive') DEFAULT 'active',
	`cta` varchar(100) DEFAULT 'Get started',
	`cta_href` varchar(255) DEFAULT '/signup',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);

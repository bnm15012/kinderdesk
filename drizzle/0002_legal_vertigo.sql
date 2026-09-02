CREATE TABLE `subscription_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`subscription_id` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(10) DEFAULT 'INR',
	`status` enum('pending','captured','failed','refunded') DEFAULT 'pending',
	`razorpay_order_id` varchar(255),
	`razorpay_payment_id` varchar(255),
	`paid_at` datetime,
	`failure_reason` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `subscription_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`plan` varchar(50) NOT NULL DEFAULT 'free',
	`amount` decimal(12,2) NOT NULL DEFAULT '0',
	`currency` varchar(10) DEFAULT 'INR',
	`billing_cycle` enum('monthly','yearly','lifetime') DEFAULT 'monthly',
	`status` enum('trialing','active','past_due','canceled','paused') DEFAULT 'trialing',
	`razorpay_customer_id` varchar(255),
	`razorpay_subscription_id` varchar(255),
	`current_period_start` datetime,
	`current_period_end` datetime,
	`trial_ends_at` datetime,
	`cancel_at_period_end` int DEFAULT 0,
	`started_at` timestamp DEFAULT (now()),
	`ended_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;
CREATE TABLE `school_announcement_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_announcement_id` int NOT NULL,
	`user_id` int NOT NULL,
	`dismissed_at` timestamp DEFAULT (now()),
	CONSTRAINT `school_announcement_dismissals_id` PRIMARY KEY(`id`),
	CONSTRAINT `school_announcement_dismissals_sa_user` UNIQUE(`school_announcement_id`,`user_id`)
);
--> statement-breakpoint
ALTER TABLE `school_announcement_dismissals` ADD CONSTRAINT `school_announcement_dismissals_sa_fk` FOREIGN KEY (`school_announcement_id`) REFERENCES `school_announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_announcement_dismissals` ADD CONSTRAINT `school_announcement_dismissals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
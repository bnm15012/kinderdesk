CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(50),
	`capacity` int,
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`logo_url` varchar(500),
	`email` varchar(255),
	`phone` varchar(50),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100) DEFAULT 'India',
	`currency` varchar(10) DEFAULT 'INR',
	`plan` varchar(50) DEFAULT 'free',
	`max_locations` int DEFAULT 1,
	`status` enum('active','suspended','pending','archived') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`first_name` varchar(255),
	`last_name` varchar(255),
	`role` enum('super_admin','school_admin','location_admin','teacher','staff','parent','accountant') DEFAULT 'staff',
	`status` enum('active','inactive','invited','suspended') DEFAULT 'invited',
	`last_login` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `waitlist` MODIFY COLUMN `inquiry_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `staff_id` int;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `parents` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `parents` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist` ADD `school_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist` ADD `location_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `locations` ADD CONSTRAINT `locations_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD CONSTRAINT `medical_notes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD CONSTRAINT `medical_notes_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
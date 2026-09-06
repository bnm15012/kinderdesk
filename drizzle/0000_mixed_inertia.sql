CREATE TABLE `announcement_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcement_id` int NOT NULL,
	`user_id` int NOT NULL,
	`dismissed_at` timestamp DEFAULT (now()),
	CONSTRAINT `announcement_dismissals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` enum('info','warning','success','critical') NOT NULL DEFAULT 'info',
	`target_role` enum('all','school_admin','location_admin','teacher','accountant') NOT NULL DEFAULT 'all',
	`is_active` int NOT NULL DEFAULT 1,
	`expires_at` datetime,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`date` date NOT NULL,
	`marked_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendance_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int NOT NULL,
	`class_id` int NOT NULL,
	`academic_year` varchar(20),
	`enrolled_at` timestamp DEFAULT (now()),
	`status` enum('active','promoted','withdrawn') DEFAULT 'active',
	CONSTRAINT `class_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`age_group` varchar(100) NOT NULL,
	`room_name` varchar(255),
	`capacity` int NOT NULL,
	`start_time` varchar(10),
	`end_time` varchar(10),
	`status` enum('active','inactive') DEFAULT 'active',
	`academic_year` varchar(20),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`uploaded_by` int,
	`uploaded_by_name` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`activity_date` date NOT NULL,
	`photo_url` varchar(500),
	`r2_key` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `curriculum_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int,
	`staff_id` int,
	`type` enum('birth_certificate','immunization_record','photo','background_check','other') NOT NULL,
	`r2_key` varchar(500),
	`public_url` varchar(500),
	`uploaded_at` timestamp DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emergency_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`relation` varchar(100) NOT NULL,
	`phone` varchar(50) NOT NULL,
	CONSTRAINT `emergency_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_structures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int,
	`name` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`frequency` enum('monthly','quarterly','annually','one_time') DEFAULT 'monthly',
	`due_day` int DEFAULT 1,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fee_structures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`parent_name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`child_name` varchar(255) NOT NULL,
	`child_dob` date,
	`program_interest` varchar(100),
	`source` varchar(100),
	`status` enum('new','contacted','tour_scheduled','applied','waitlisted','rejected','enrolled') DEFAULT 'new',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int NOT NULL,
	`fee_structure_id` int,
	`amount` decimal(12,2) NOT NULL,
	`due_date` date,
	`status` enum('draft','sent','paid','overdue','cancelled','refunded') DEFAULT 'draft',
	`paid_at` datetime,
	`paid_method` enum('cash','razorpay','bank_transfer','cheque','other'),
	`paid_notes` text,
	`razorpay_order_id` varchar(255),
	`razorpay_payment_id` varchar(255),
	`generated_month` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`pincode` varchar(20),
	`phone` varchar(50),
	`capacity` int,
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int NOT NULL,
	`allergies` text,
	`conditions` text,
	`medications` text,
	`notes` text,
	CONSTRAINT `medical_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`code` varchar(128) NOT NULL,
	`type` enum('email_confirm','password_reset') NOT NULL DEFAULT 'email_confirm',
	`expires_at` datetime NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `otps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int NOT NULL,
	`relation` enum('mother','father','guardian','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`address` text,
	`is_primary` int DEFAULT 0,
	`is_emergency` int DEFAULT 0,
	CONSTRAINT `parents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`invoice_id` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` enum('cash','bank_transfer','razorpay','cheque','other'),
	`razorpay_payment_id` varchar(255),
	`paid_at` timestamp DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` varchar(50) NOT NULL DEFAULT '₹0',
	`period` varchar(50) NOT NULL DEFAULT 'forever',
	`currency` varchar(10) DEFAULT 'INR',
	`description` text,
	`features` varchar(2000) DEFAULT '[]',
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
	`pincode` varchar(20),
	`country` varchar(100) DEFAULT 'India',
	`currency` varchar(10) DEFAULT 'INR',
	`plan` varchar(50) DEFAULT 'free',
	`razorpay_key_id` varchar(255),
	`razorpay_key_secret` varchar(255),
	`max_locations` int DEFAULT 1,
	`max_students` int DEFAULT 50,
	`max_staff` int DEFAULT 3,
	`status` enum('active','suspended','pending','archived') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`user_id` int,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`role` enum('teacher','assistant','admin','principal','support') DEFAULT 'teacher',
	`join_date` date,
	`salary` decimal(12,2),
	`status` enum('active','inactive','terminated','on_leave') DEFAULT 'active',
	`background_check_status` enum('pending','in_progress','verified','rejected','expired') DEFAULT 'pending',
	`background_check_doc_url` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('present','absent','half_day','leave') NOT NULL,
	`notes` text,
	CONSTRAINT `staff_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_class_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`class_id` int NOT NULL,
	`academic_year` varchar(20),
	CONSTRAINT `staff_class_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_payroll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`basic_salary` decimal(12,2) NOT NULL,
	`deductions` decimal(12,2) DEFAULT '0',
	`bonus` decimal(12,2) DEFAULT '0',
	`net_salary` decimal(12,2) NOT NULL,
	`status` enum('pending','paid') DEFAULT 'pending',
	`paid_at` datetime,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `staff_payroll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`student_id` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('present','absent','half_day','leave') NOT NULL DEFAULT 'present',
	`marked_by` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `student_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`date_of_birth` date,
	`gender` enum('male','female','other','prefer_not_to_say'),
	`blood_group` varchar(10),
	`photo_url` varchar(500),
	`status` enum('inquiry','applied','waitlisted','enrolled','graduated','withdrawn') DEFAULT 'inquiry',
	`current_class_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`first_name` varchar(255),
	`last_name` varchar(255),
	`phone` varchar(50),
	`role` enum('super_admin','school_admin','location_admin','teacher','staff','parent','accountant') DEFAULT 'staff',
	`status` enum('active','inactive','invited','suspended') DEFAULT 'invited',
	`email_confirmed` int NOT NULL DEFAULT 0,
	`last_login` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`inquiry_id` int NOT NULL,
	`priority` int DEFAULT 0,
	`position` int DEFAULT 0,
	`status` enum('active','offered','joined','declined','expired') DEFAULT 'active',
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcement_dismissals` ADD CONSTRAINT `announcement_dismissals_announcement_id_announcements_id_fk` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcement_dismissals` ADD CONSTRAINT `announcement_dismissals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_marked_by_staff_id_fk` FOREIGN KEY (`marked_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curriculum_activities` ADD CONSTRAINT `curriculum_activities_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curriculum_activities` ADD CONSTRAINT `curriculum_activities_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curriculum_activities` ADD CONSTRAINT `curriculum_activities_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curriculum_activities` ADD CONSTRAINT `curriculum_activities_uploaded_by_staff_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_fee_structure_id_fee_structures_id_fk` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `locations` ADD CONSTRAINT `locations_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD CONSTRAINT `medical_notes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD CONSTRAINT `medical_notes_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD CONSTRAINT `medical_notes_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_payroll` ADD CONSTRAINT `staff_payroll_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_payroll` ADD CONSTRAINT `staff_payroll_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_payroll` ADD CONSTRAINT `staff_payroll_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_marked_by_staff_id_fk` FOREIGN KEY (`marked_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_current_class_id_classes_id_fk` FOREIGN KEY (`current_class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_inquiry_id_inquiries_id_fk` FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON DELETE no action ON UPDATE no action;
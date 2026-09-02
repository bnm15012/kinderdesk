CREATE TABLE `class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
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
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int,
	`type` enum('birth_certificate','immunization_record','photo','background_check','other') NOT NULL,
	`r2_key` varchar(500),
	`public_url` varchar(500),
	`uploaded_at` timestamp DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emergency_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`relation` varchar(100) NOT NULL,
	`phone` varchar(50) NOT NULL,
	CONSTRAINT `emergency_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_structures` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`student_id` int NOT NULL,
	`fee_structure_id` int,
	`amount` decimal(12,2) NOT NULL,
	`due_date` date,
	`status` enum('draft','sent','paid','overdue','cancelled','refunded') DEFAULT 'draft',
	`paid_at` datetime,
	`razorpay_order_id` varchar(255),
	`razorpay_payment_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`allergies` text,
	`conditions` text,
	`medications` text,
	`notes` text,
	CONSTRAINT `medical_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`invoice_id` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` enum('cash','bank_transfer','razorpay','cheque','other'),
	`razorpay_payment_id` varchar(255),
	`paid_at` timestamp DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`staff_id` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('present','absent','half_day','leave') NOT NULL,
	`notes` text,
	CONSTRAINT `staff_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_class_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_id` int NOT NULL,
	`class_id` int NOT NULL,
	`academic_year` varchar(20),
	CONSTRAINT `staff_class_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
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
CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiry_id` int,
	`priority` int DEFAULT 0,
	`position` int DEFAULT 0,
	`status` enum('active','offered','joined','declined','expired') DEFAULT 'active',
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_fee_structure_id_fee_structures_id_fk` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_notes` ADD CONSTRAINT `medical_notes_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_current_class_id_classes_id_fk` FOREIGN KEY (`current_class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_inquiry_id_inquiries_id_fk` FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON DELETE no action ON UPDATE no action;
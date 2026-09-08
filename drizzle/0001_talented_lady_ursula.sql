CREATE TABLE `class_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`subject_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `class_subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_subjects_class_subject` UNIQUE(`class_id`,`subject_id`)
);
--> statement-breakpoint
CREATE TABLE `exam_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exam_id` int NOT NULL,
	`subject_id` int NOT NULL,
	`max_marks` decimal(6,2) NOT NULL,
	`exam_date` date,
	`status` enum('active','cancelled') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `exam_subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `exam_subjects_exam_subject` UNIQUE(`exam_id`,`subject_id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`academic_year` varchar(20) NOT NULL,
	`term` varchar(100) NOT NULL,
	`exam_type` varchar(50) DEFAULT 'regular',
	`start_date` date,
	`end_date` date,
	`status` enum('draft','active','archived') DEFAULT 'draft',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`amount` decimal(12,2) NOT NULL,
	`expense_date` date,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grading_scales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`board` varchar(20) NOT NULL,
	`name` varchar(50) NOT NULL,
	`min_percentage` decimal(5,2) NOT NULL,
	`max_percentage` decimal(5,2) NOT NULL,
	`grade_point` decimal(3,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `grading_scales_id` PRIMARY KEY(`id`),
	CONSTRAINT `grading_scales_school_board_name` UNIQUE(`school_id`,`board`,`name`)
);
--> statement-breakpoint
CREATE TABLE `homework` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`subject_id` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`due_date` date,
	`attachments` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `homework_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`student_id` int NOT NULL,
	`academic_year` varchar(20) NOT NULL,
	`class_id` int,
	`term` varchar(100) NOT NULL,
	`r2_key` varchar(500),
	`public_url` varchar(500),
	`uploaded_at` timestamp DEFAULT (now()),
	CONSTRAINT `report_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_cards_student_year_term` UNIQUE(`student_id`,`academic_year`,`term`)
);
--> statement-breakpoint
CREATE TABLE `school_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text,
	`target` enum('all','parents','staff') DEFAULT 'all',
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `school_announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_marks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`exam_subject_id` int NOT NULL,
	`marks` decimal(6,2),
	`grade` varchar(10),
	`notes` text,
	`marked_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_marks_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_marks_student_exam` UNIQUE(`student_id`,`exam_subject_id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_school_name` UNIQUE(`school_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `timetable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`location_id` int NOT NULL,
	`class_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`period_number` int NOT NULL,
	`start_time` varchar(10),
	`end_time` varchar(10),
	`subject_id` int,
	`teacher_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `timetable_id` PRIMARY KEY(`id`),
	CONSTRAINT `timetable_class_day_period` UNIQUE(`class_id`,`day_of_week`,`period_number`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','school_admin','location_admin','teacher','staff','receptionist','parent','accountant') DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `schools` ADD `board` varchar(20) DEFAULT 'generic';--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `plan_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `announcement_dismissals` ADD CONSTRAINT `announcement_dismissals_user_announcement` UNIQUE(`user_id`,`announcement_id`);--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_class_date` UNIQUE(`class_id`,`date`);--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_student_class_year` UNIQUE(`student_id`,`class_id`,`academic_year`);--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_school_location_name` UNIQUE(`school_id`,`location_id`,`name`);--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_student_phone` UNIQUE(`student_id`,`phone`);--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_school_location_class_name` UNIQUE(`school_id`,`location_id`,`class_id`,`name`);--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_school_student_fee_month` UNIQUE(`school_id`,`student_id`,`fee_structure_id`,`generated_month`);--> statement-breakpoint
ALTER TABLE `locations` ADD CONSTRAINT `locations_school_name` UNIQUE(`school_id`,`name`);--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_student_email` UNIQUE(`student_id`,`email`);--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_razorpay_id` UNIQUE(`razorpay_payment_id`);--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_school_email` UNIQUE(`school_id`,`email`);--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staff_date` UNIQUE(`staff_id`,`date`);--> statement-breakpoint
ALTER TABLE `staff_class_assignments` ADD CONSTRAINT `staff_class_assignments_staff_class` UNIQUE(`staff_id`,`class_id`,`academic_year`);--> statement-breakpoint
ALTER TABLE `staff_payroll` ADD CONSTRAINT `staff_payroll_staff_month` UNIQUE(`staff_id`,`month`);--> statement-breakpoint
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_student_date` UNIQUE(`student_id`,`date`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `waitlist` ADD CONSTRAINT `waitlist_inquiry` UNIQUE(`inquiry_id`);--> statement-breakpoint
ALTER TABLE `class_subjects` ADD CONSTRAINT `class_subjects_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_subjects` ADD CONSTRAINT `class_subjects_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_subjects` ADD CONSTRAINT `class_subjects_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_subjects` ADD CONSTRAINT `class_subjects_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_subjects` ADD CONSTRAINT `exam_subjects_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_subjects` ADD CONSTRAINT `exam_subjects_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grading_scales` ADD CONSTRAINT `grading_scales_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homework` ADD CONSTRAINT `homework_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homework` ADD CONSTRAINT `homework_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homework` ADD CONSTRAINT `homework_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homework` ADD CONSTRAINT `homework_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homework` ADD CONSTRAINT `homework_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_announcements` ADD CONSTRAINT `school_announcements_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_announcements` ADD CONSTRAINT `school_announcements_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_announcements` ADD CONSTRAINT `school_announcements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_marks` ADD CONSTRAINT `student_marks_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_marks` ADD CONSTRAINT `student_marks_exam_subject_id_exam_subjects_id_fk` FOREIGN KEY (`exam_subject_id`) REFERENCES `exam_subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_marks` ADD CONSTRAINT `student_marks_marked_by_staff_id_fk` FOREIGN KEY (`marked_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_teacher_id_staff_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;
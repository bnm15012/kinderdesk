ALTER TABLE `inquiries` ADD `student_id` int;--> statement-breakpoint
ALTER TABLE `students` ADD `admission_number` varchar(50);--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_school_admission_number` UNIQUE(`school_id`,`admission_number`);--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;
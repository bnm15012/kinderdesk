SET FOREIGN_KEY_CHECKS=0;
-- MySQL dump 10.13  Distrib 9.3.0, for macos14.7 (arm64)
--
-- Host: localhost    Database: kinderdesk
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcement_dismissals`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `announcement_dismissals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement_id` int NOT NULL,
  `user_id` int NOT NULL,
  `dismissed_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `announcement_dismissals_announcement_id_announcements_id_fk` (`announcement_id`),
  KEY `announcement_dismissals_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `announcement_dismissals_announcement_id_announcements_id_fk` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`),
  CONSTRAINT `announcement_dismissals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcements`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `type` enum('info','warning','success','critical') NOT NULL DEFAULT 'info',
  `target_role` enum('all','school_admin','location_admin','teacher','accountant') NOT NULL DEFAULT 'all',
  `is_active` int NOT NULL DEFAULT '1',
  `expires_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcements_created_by_users_id_fk` (`created_by`),
  CONSTRAINT `announcements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance_sessions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `date` date NOT NULL,
  `marked_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `attendance_sessions_school_id_schools_id_fk` (`school_id`),
  KEY `attendance_sessions_location_id_locations_id_fk` (`location_id`),
  KEY `attendance_sessions_class_id_classes_id_fk` (`class_id`),
  KEY `attendance_sessions_marked_by_staff_id_fk` (`marked_by`),
  CONSTRAINT `attendance_sessions_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `attendance_sessions_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `attendance_sessions_marked_by_staff_id_fk` FOREIGN KEY (`marked_by`) REFERENCES `staff` (`id`),
  CONSTRAINT `attendance_sessions_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_enrollments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `class_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `enrolled_at` timestamp NULL DEFAULT (now()),
  `status` enum('active','promoted','withdrawn') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `class_enrollments_school_id_schools_id_fk` (`school_id`),
  KEY `class_enrollments_location_id_locations_id_fk` (`location_id`),
  KEY `class_enrollments_student_id_students_id_fk` (`student_id`),
  KEY `class_enrollments_class_id_classes_id_fk` (`class_id`),
  CONSTRAINT `class_enrollments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_enrollments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `class_enrollments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `class_enrollments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_subjects`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `class_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `class_subjects_school_id_schools_id_fk` (`school_id`),
  KEY `class_subjects_location_id_locations_id_fk` (`location_id`),
  KEY `class_subjects_class_id_classes_id_fk` (`class_id`),
  KEY `class_subjects_subject_id_subjects_id_fk` (`subject_id`),
  CONSTRAINT `class_subjects_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_subjects_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `class_subjects_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `class_subjects_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `age_group` varchar(100) NOT NULL,
  `room_name` varchar(255) DEFAULT NULL,
  `capacity` int NOT NULL,
  `start_time` varchar(10) DEFAULT NULL,
  `end_time` varchar(10) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `academic_year` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `classes_school_id_schools_id_fk` (`school_id`),
  KEY `classes_location_id_locations_id_fk` (`location_id`),
  CONSTRAINT `classes_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `classes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `curriculum_activities`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `curriculum_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `uploaded_by` int DEFAULT NULL,
  `uploaded_by_name` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `activity_date` date NOT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `r2_key` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `curriculum_activities_school_id_schools_id_fk` (`school_id`),
  KEY `curriculum_activities_location_id_locations_id_fk` (`location_id`),
  KEY `curriculum_activities_class_id_classes_id_fk` (`class_id`),
  KEY `curriculum_activities_uploaded_by_staff_id_fk` (`uploaded_by`),
  CONSTRAINT `curriculum_activities_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `curriculum_activities_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `curriculum_activities_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `curriculum_activities_uploaded_by_staff_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documents`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `staff_id` int DEFAULT NULL,
  `type` enum('birth_certificate','immunization_record','photo','background_check','other') NOT NULL,
  `r2_key` varchar(500) DEFAULT NULL,
  `public_url` varchar(500) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `documents_school_id_schools_id_fk` (`school_id`),
  KEY `documents_location_id_locations_id_fk` (`location_id`),
  KEY `documents_student_id_students_id_fk` (`student_id`),
  KEY `documents_staff_id_staff_id_fk` (`staff_id`),
  CONSTRAINT `documents_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `documents_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `documents_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`),
  CONSTRAINT `documents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emergency_contacts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `emergency_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `relation` varchar(100) NOT NULL,
  `phone` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `emergency_contacts_school_id_schools_id_fk` (`school_id`),
  KEY `emergency_contacts_location_id_locations_id_fk` (`location_id`),
  KEY `emergency_contacts_student_id_students_id_fk` (`student_id`),
  CONSTRAINT `emergency_contacts_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `emergency_contacts_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `emergency_contacts_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exam_subjects`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `exam_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `max_marks` decimal(6,2) NOT NULL,
  `exam_date` date DEFAULT NULL,
  `status` enum('active','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `exam_subjects_exam_id_exams_id_fk` (`exam_id`),
  KEY `exam_subjects_subject_id_subjects_id_fk` (`subject_id`),
  CONSTRAINT `exam_subjects_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`),
  CONSTRAINT `exam_subjects_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exams`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `term` varchar(100) NOT NULL,
  `exam_type` varchar(50) DEFAULT 'regular',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('draft','active','archived') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `exams_school_id_schools_id_fk` (`school_id`),
  KEY `exams_location_id_locations_id_fk` (`location_id`),
  KEY `exams_class_id_classes_id_fk` (`class_id`),
  CONSTRAINT `exams_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `exams_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `exams_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `amount` decimal(12,2) NOT NULL,
  `expense_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expenses_school_id` (`school_id`),
  KEY `expenses_location_id` (`location_id`),
  KEY `expenses_created_by_fk` (`created_by`),
  CONSTRAINT `expenses_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `expenses_school_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fee_structures`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `fee_structures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `frequency` enum('monthly','quarterly','annually','one_time') DEFAULT 'monthly',
  `due_day` int DEFAULT '1',
  `description` text,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `fee_structures_school_id_schools_id_fk` (`school_id`),
  KEY `fee_structures_location_id_locations_id_fk` (`location_id`),
  KEY `fee_structures_class_id_classes_id_fk` (`class_id`),
  CONSTRAINT `fee_structures_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `fee_structures_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `fee_structures_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grading_scales`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `grading_scales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `board` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `min_percentage` decimal(5,2) NOT NULL,
  `max_percentage` decimal(5,2) NOT NULL,
  `grade_point` decimal(3,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `grading_scales_school_id_schools_id_fk` (`school_id`),
  CONSTRAINT `grading_scales_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homework`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `homework` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `subject_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `attachments` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `homework_school_id_schools_id_fk` (`school_id`),
  KEY `homework_location_id_locations_id_fk` (`location_id`),
  KEY `homework_class_id_classes_id_fk` (`class_id`),
  KEY `homework_subject_id_subjects_id_fk` (`subject_id`),
  KEY `homework_created_by_users_id_fk` (`created_by`),
  CONSTRAINT `homework_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `homework_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `homework_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `homework_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `homework_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inquiries`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `parent_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `child_name` varchar(255) NOT NULL,
  `child_dob` date DEFAULT NULL,
  `program_interest` varchar(100) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `status` enum('new','contacted','tour_scheduled','applied','waitlisted','rejected','enrolled') DEFAULT 'new',
  `notes` text,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `inquiries_school_id_schools_id_fk` (`school_id`),
  KEY `inquiries_location_id_locations_id_fk` (`location_id`),
  CONSTRAINT `inquiries_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `inquiries_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int NOT NULL,
  `fee_structure_id` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('draft','sent','paid','overdue','cancelled','refunded') DEFAULT 'draft',
  `paid_at` datetime DEFAULT NULL,
  `paid_method` enum('cash','razorpay','bank_transfer','cheque','other') DEFAULT NULL,
  `paid_notes` text,
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `generated_month` varchar(7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `invoices_school_id_schools_id_fk` (`school_id`),
  KEY `invoices_location_id_locations_id_fk` (`location_id`),
  KEY `invoices_student_id_students_id_fk` (`student_id`),
  KEY `invoices_fee_structure_id_fee_structures_id_fk` (`fee_structure_id`),
  CONSTRAINT `invoices_fee_structure_id_fee_structures_id_fk` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures` (`id`),
  CONSTRAINT `invoices_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `invoices_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `invoices_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `locations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `locations_school_id_schools_id_fk` (`school_id`),
  CONSTRAINT `locations_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_notes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `medical_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int NOT NULL,
  `allergies` text,
  `conditions` text,
  `medications` text,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `medical_notes_school_id_schools_id_fk` (`school_id`),
  KEY `medical_notes_location_id_locations_id_fk` (`location_id`),
  KEY `medical_notes_student_id_students_id_fk` (`student_id`),
  CONSTRAINT `medical_notes_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `medical_notes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `medical_notes_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otps`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(128) NOT NULL,
  `type` enum('email_confirm','password_reset') NOT NULL DEFAULT 'email_confirm',
  `expires_at` datetime NOT NULL,
  `used` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parents`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `parents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int NOT NULL,
  `relation` enum('mother','father','guardian','other') NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `is_primary` int DEFAULT '0',
  `is_emergency` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `parents_school_id_schools_id_fk` (`school_id`),
  KEY `parents_location_id_locations_id_fk` (`location_id`),
  KEY `parents_student_id_students_id_fk` (`student_id`),
  CONSTRAINT `parents_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `parents_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `parents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `method` enum('cash','bank_transfer','razorpay','cheque','other') DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `payments_school_id_schools_id_fk` (`school_id`),
  KEY `payments_location_id_locations_id_fk` (`location_id`),
  KEY `payments_invoice_id_invoices_id_fk` (`invoice_id`),
  CONSTRAINT `payments_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `payments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `payments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plans`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` varchar(50) NOT NULL DEFAULT '₹0',
  `period` varchar(50) NOT NULL DEFAULT 'forever',
  `currency` varchar(10) DEFAULT 'INR',
  `description` text,
  `features` varchar(2000) DEFAULT '[]',
  `featured` int DEFAULT '0',
  `display_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `cta` varchar(100) DEFAULT 'Get started',
  `cta_href` varchar(255) DEFAULT '/signup',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plans_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_cards`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `report_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `student_id` int NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `class_id` int DEFAULT NULL,
  `term` varchar(100) NOT NULL,
  `r2_key` varchar(500) DEFAULT NULL,
  `public_url` varchar(500) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `report_cards_school_id_schools_id_fk` (`school_id`),
  KEY `report_cards_location_id_locations_id_fk` (`location_id`),
  KEY `report_cards_student_id_students_id_fk` (`student_id`),
  KEY `report_cards_class_id_classes_id_fk` (`class_id`),
  CONSTRAINT `report_cards_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `report_cards_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `report_cards_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `report_cards_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `school_announcements`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `school_announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text,
  `target` enum('all','parents','staff') DEFAULT 'all',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `school_announcements_school_id_schools_id_fk` (`school_id`),
  KEY `school_announcements_location_id_locations_id_fk` (`location_id`),
  KEY `school_announcements_created_by_users_id_fk` (`created_by`),
  CONSTRAINT `school_announcements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `school_announcements_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `school_announcements_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schools`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `currency` varchar(10) DEFAULT 'INR',
  `plan` varchar(50) DEFAULT 'free',
  `razorpay_key_id` varchar(255) DEFAULT NULL,
  `razorpay_key_secret` varchar(255) DEFAULT NULL,
  `max_locations` int DEFAULT '1',
  `max_students` int DEFAULT '50',
  `max_staff` int DEFAULT '3',
  `status` enum('active','suspended','pending','archived') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `board` varchar(20) DEFAULT 'generic',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('teacher','assistant','admin','principal','support') DEFAULT 'teacher',
  `join_date` date DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT NULL,
  `status` enum('active','inactive','terminated','on_leave') DEFAULT 'active',
  `background_check_status` enum('pending','in_progress','verified','rejected','expired') DEFAULT 'pending',
  `background_check_doc_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `staff_school_id_schools_id_fk` (`school_id`),
  KEY `staff_location_id_locations_id_fk` (`location_id`),
  KEY `staff_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `staff_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `staff_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `staff_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_attendance`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `staff_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','half_day','leave') NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `staff_attendance_school_id_schools_id_fk` (`school_id`),
  KEY `staff_attendance_location_id_locations_id_fk` (`location_id`),
  KEY `staff_attendance_staff_id_staff_id_fk` (`staff_id`),
  CONSTRAINT `staff_attendance_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `staff_attendance_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `staff_attendance_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_class_assignments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `staff_class_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `class_id` int NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `staff_class_assignments_school_id_schools_id_fk` (`school_id`),
  KEY `staff_class_assignments_location_id_locations_id_fk` (`location_id`),
  KEY `staff_class_assignments_staff_id_staff_id_fk` (`staff_id`),
  KEY `staff_class_assignments_class_id_classes_id_fk` (`class_id`),
  CONSTRAINT `staff_class_assignments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `staff_class_assignments_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `staff_class_assignments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `staff_class_assignments_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_payroll`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `staff_payroll` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `month` varchar(7) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `deductions` decimal(12,2) DEFAULT '0.00',
  `bonus` decimal(12,2) DEFAULT '0.00',
  `net_salary` decimal(12,2) NOT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `staff_payroll_school_id_schools_id_fk` (`school_id`),
  KEY `staff_payroll_location_id_locations_id_fk` (`location_id`),
  KEY `staff_payroll_staff_id_staff_id_fk` (`staff_id`),
  CONSTRAINT `staff_payroll_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `staff_payroll_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `staff_payroll_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_attendance`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `student_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `student_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','half_day','leave') NOT NULL DEFAULT 'present',
  `marked_by` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `student_attendance_school_id_schools_id_fk` (`school_id`),
  KEY `student_attendance_location_id_locations_id_fk` (`location_id`),
  KEY `student_attendance_class_id_classes_id_fk` (`class_id`),
  KEY `student_attendance_student_id_students_id_fk` (`student_id`),
  KEY `student_attendance_marked_by_staff_id_fk` (`marked_by`),
  CONSTRAINT `student_attendance_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `student_attendance_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `student_attendance_marked_by_staff_id_fk` FOREIGN KEY (`marked_by`) REFERENCES `staff` (`id`),
  CONSTRAINT `student_attendance_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `student_attendance_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_marks`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `student_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `exam_subject_id` int NOT NULL,
  `marks` decimal(6,2) DEFAULT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `notes` text,
  `marked_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_marks_student_id_students_id_fk` (`student_id`),
  KEY `student_marks_exam_subject_id_exam_subjects_id_fk` (`exam_subject_id`),
  KEY `student_marks_marked_by_staff_id_fk` (`marked_by`),
  CONSTRAINT `student_marks_exam_subject_id_exam_subjects_id_fk` FOREIGN KEY (`exam_subject_id`) REFERENCES `exam_subjects` (`id`),
  CONSTRAINT `student_marks_marked_by_staff_id_fk` FOREIGN KEY (`marked_by`) REFERENCES `staff` (`id`),
  CONSTRAINT `student_marks_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `status` enum('inquiry','applied','waitlisted','enrolled','graduated','withdrawn') DEFAULT 'inquiry',
  `current_class_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `students_school_id_schools_id_fk` (`school_id`),
  KEY `students_location_id_locations_id_fk` (`location_id`),
  KEY `students_current_class_id_classes_id_fk` (`current_class_id`),
  CONSTRAINT `students_current_class_id_classes_id_fk` FOREIGN KEY (`current_class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `students_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `students_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subjects`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `subjects_school_id_schools_id_fk` (`school_id`),
  CONSTRAINT `subjects_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscription_payments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `subscription_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `subscription_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `status` enum('pending','captured','failed','refunded') DEFAULT 'pending',
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `failure_reason` text,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `subscription_payments_school_id_schools_id_fk` (`school_id`),
  KEY `subscription_payments_subscription_id_subscriptions_id_fk` (`subscription_id`),
  CONSTRAINT `subscription_payments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `subscription_payments_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscriptions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `plan` varchar(50) NOT NULL DEFAULT 'free',
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'INR',
  `billing_cycle` enum('monthly','yearly','lifetime') DEFAULT 'monthly',
  `status` enum('trialing','active','past_due','canceled','paused') DEFAULT 'trialing',
  `razorpay_customer_id` varchar(255) DEFAULT NULL,
  `razorpay_subscription_id` varchar(255) DEFAULT NULL,
  `current_period_start` datetime DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `cancel_at_period_end` int DEFAULT '0',
  `started_at` timestamp NULL DEFAULT (now()),
  `ended_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subscriptions_school_id_schools_id_fk` (`school_id`),
  CONSTRAINT `subscriptions_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timetable`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `timetable` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `class_id` int NOT NULL,
  `day_of_week` int NOT NULL,
  `period_number` int NOT NULL,
  `start_time` varchar(10) DEFAULT NULL,
  `end_time` varchar(10) DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `timetable_school_id_schools_id_fk` (`school_id`),
  KEY `timetable_location_id_locations_id_fk` (`location_id`),
  KEY `timetable_class_id_classes_id_fk` (`class_id`),
  KEY `timetable_subject_id_subjects_id_fk` (`subject_id`),
  KEY `timetable_teacher_id_staff_id_fk` (`teacher_id`),
  CONSTRAINT `timetable_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `timetable_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `timetable_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  CONSTRAINT `timetable_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`),
  CONSTRAINT `timetable_teacher_id_staff_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('super_admin','school_admin','location_admin','teacher','staff','parent','accountant') DEFAULT 'staff',
  `status` enum('active','inactive','invited','suspended') DEFAULT 'invited',
  `email_confirmed` int NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `users_school_id_schools_id_fk` (`school_id`),
  KEY `users_location_id_locations_id_fk` (`location_id`),
  CONSTRAINT `users_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `users_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `waitlist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `waitlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `location_id` int NOT NULL,
  `inquiry_id` int NOT NULL,
  `priority` int DEFAULT '0',
  `position` int DEFAULT '0',
  `status` enum('active','offered','joined','declined','expired') DEFAULT 'active',
  `added_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `waitlist_school_id_schools_id_fk` (`school_id`),
  KEY `waitlist_location_id_locations_id_fk` (`location_id`),
  KEY `waitlist_inquiry_id_inquiries_id_fk` (`inquiry_id`),
  CONSTRAINT `waitlist_inquiry_id_inquiries_id_fk` FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries` (`id`),
  CONSTRAINT `waitlist_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `waitlist_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-08 12:45:17

ALTER TABLE `schools` ADD COLUMN IF NOT EXISTS `board` VARCHAR(20) NOT NULL DEFAULT 'generic';
SET FOREIGN_KEY_CHECKS=1;

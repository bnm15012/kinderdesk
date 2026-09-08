ALTER TABLE `plans` DROP INDEX `plans_slug_unique`;--> statement-breakpoint
ALTER TABLE `plans` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `schools` DROP COLUMN `slug`;
CREATE TABLE `scheduled_emails` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`recipient_email` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`is_encrypted` integer DEFAULT false NOT NULL,
	`send_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_retry_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

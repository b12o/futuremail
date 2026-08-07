import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scheduledEmails = sqliteTable("scheduled_emails", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isEncrypted: integer("is_encrypted", { mode: "boolean" }).notNull().default(false),
  sendAt: integer("send_at", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type NewScheduledEmail = typeof scheduledEmails.$inferInsert;

export const EMAIL_STATUS = ["pending", "sending", "delivered", "failed"] as const;
export type EmailStatus = (typeof EMAIL_STATUS)[number];

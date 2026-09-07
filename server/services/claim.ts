import { inArray } from "drizzle-orm";
import { client, db } from "../db";
import { scheduledEmails } from "../db/schema";

export async function claimDueEmails(batchSize: number) {
  const result = await client.execute({
    sql: `UPDATE scheduled_emails
          SET status = 'sending'
          WHERE id IN (
            SELECT id FROM scheduled_emails
            WHERE status = 'pending'
              AND send_at <= unixepoch()
              AND (next_retry_at IS NULL OR next_retry_at <= unixepoch())
            LIMIT ?
          )
          RETURNING id`,
    args: [batchSize],
  });
  const ids = result.rows.map((row) => row.id as string);
  if (ids.length === 0) {
    return [];
  }
  return db.select().from(scheduledEmails).where(inArray(scheduledEmails.id, ids));
}

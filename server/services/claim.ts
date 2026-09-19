import { inArray } from "drizzle-orm";
import { client, db } from "../db";
import { scheduledEmails } from "../db/schema";

export async function claimDueEmails(batchSize: number) {
  const result = await client.execute({
    sql: `UPDATE scheduled_emails
          SET status = 'sending', claimed_at = unixepoch()
          WHERE id IN (
            SELECT id FROM scheduled_emails
            WHERE status = 'pending'
              AND send_at <= unixepoch()
              AND (next_retry_at IS NULL OR next_retry_at <= unixepoch())
            ORDER BY send_at ASC
            LIMIT ?
          )
          RETURNING id`,
    args: [batchSize],
  });
  const ids = result.rows.map((row) => row.id as string);
  if (ids.length === 0) {
    return [];
  }
  return db
    .select()
    .from(scheduledEmails)
    .where(inArray(scheduledEmails.id, ids));
}

export async function releaseStaleClaims(timeoutMs: number): Promise<number> {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const result = await client.execute({
    sql: `UPDATE scheduled_emails
          SET status = 'pending', claimed_at = NULL
          WHERE status = 'sending'
            AND (claimed_at IS NULL OR claimed_at <= unixepoch() - ?)`,
    args: [timeoutSeconds],
  });
  return result.rowsAffected;
}

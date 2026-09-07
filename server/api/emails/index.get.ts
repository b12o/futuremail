import { eq } from "drizzle-orm";
import { db } from "../../db";
import { scheduledEmails } from "../../db/schema";
import { auth } from "../../auth";

const IN_TRANSIT_STATUSES = new Set(["pending", "sending"]);

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const rows = await db
    .select()
    .from(scheduledEmails)
    .where(eq(scheduledEmails.userId, session.user.id))
    .orderBy(scheduledEmails.sendAt);

  return rows.map((row) => {
    if (IN_TRANSIT_STATUSES.has(row.status)) {
      return {
        id: row.id,
        recipientEmail: row.recipientEmail,
        isEncrypted: row.isEncrypted,
        sendAt: row.sendAt,
        status: row.status,
        attempts: row.attempts,
        nextRetryAt: row.nextRetryAt,
        createdAt: row.createdAt,
        subject: null,
        body: null,
      };
    }
    return row;
  });
});

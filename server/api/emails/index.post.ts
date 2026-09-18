import { db } from "../../db";
import { scheduledEmails } from "../../db/schema";
import { auth } from "../../auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody<{
    recipientEmail?: unknown;
    subject?: unknown;
    body?: unknown;
    isEncrypted?: unknown;
    sendAt?: unknown;
  }>(event);

  if (
    body?.recipientEmail !== undefined &&
    (typeof body.recipientEmail !== "string" ||
      body.recipientEmail.trim().toLowerCase() !==
        session.user.email.toLowerCase())
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "recipientEmail must be the signed-in user's email",
    });
  }
  const recipientEmail = session.user.email;
  if (typeof body?.subject !== "string" || body.subject.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "subject is required",
    });
  }
  if (typeof body?.body !== "string" || body.body.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "body is required" });
  }
  if (body.isEncrypted !== undefined && typeof body.isEncrypted !== "boolean") {
    throw createError({
      statusCode: 400,
      statusMessage: "isEncrypted must be a boolean",
    });
  }

  const sendAt = new Date(String(body.sendAt));
  if (Number.isNaN(sendAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "sendAt must be a valid ISO 8601 date",
    });
  }
  if (sendAt.getTime() <= Date.now()) {
    throw createError({
      statusCode: 400,
      statusMessage: "sendAt must be in the future",
    });
  }

  const [row] = await db
    .insert(scheduledEmails)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      recipientEmail,
      subject: body.subject,
      body: body.body,
      isEncrypted: body.isEncrypted ?? false,
      sendAt,
      status: "pending",
    })
    .returning();

  setResponseStatus(event, 201);
  return row;
});

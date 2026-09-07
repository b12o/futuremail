import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { ScheduledEmail } from "../db/schema";

process.env.DATABASE_URL = `file:/tmp/futuremail-claim-test-${crypto.randomUUID()}.db`;

const { initDb, client, db } = await import("../db");
const { scheduledEmails } = await import("../db/schema");
const { claimDueEmails } = await import("./claim");

let allRows: ScheduledEmail[] = [];

beforeAll(async () => {
  await initDb();
  const now = new Date();
  allRows = await db
    .insert(scheduledEmails)
    .values([
      {
        id: "due-1",
        userId: "user-1",
        recipientEmail: "dest@example.com",
        subject: "due now",
        body: "body",
        sendAt: new Date(now.getTime() - 60_000),
        status: "pending",
      },
      {
        id: "due-retry",
        userId: "user-1",
        recipientEmail: "dest@example.com",
        subject: "due, retry elapsed",
        body: "body",
        sendAt: new Date(now.getTime() - 60_000),
        status: "pending",
        attempts: 1,
        nextRetryAt: new Date(now.getTime() - 30_000),
      },
      {
        id: "future",
        userId: "user-1",
        recipientEmail: "dest@example.com",
        subject: "not yet",
        body: "body",
        sendAt: new Date(now.getTime() + 3_600_000),
        status: "pending",
      },
      {
        id: "retry-pending",
        userId: "user-1",
        recipientEmail: "dest@example.com",
        subject: "backoff not elapsed",
        body: "body",
        sendAt: new Date(now.getTime() - 60_000),
        status: "pending",
        attempts: 1,
        nextRetryAt: new Date(now.getTime() + 3_600_000),
      },
      {
        id: "already-sent",
        userId: "user-1",
        recipientEmail: "dest@example.com",
        subject: "done",
        body: "body",
        sendAt: new Date(now.getTime() - 60_000),
        status: "delivered",
      },
    ])
    .returning();
});

afterAll(async () => {
  await client.close();
});

describe("claimDueEmails", () => {
  test("claims only due pending rows atomically", async () => {
    const claimed = await claimDueEmails(25);
    const ids = claimed.map((row) => row.id).sort();
    expect(ids).toEqual(["due-1", "due-retry"]);
    for (const row of claimed) {
      expect(row.status).toBe("sending");
    }
    const stillPending = await db.select().from(scheduledEmails);
    const future = stillPending.find((row) => row.id === "future");
    expect(future?.status).toBe("pending");
    const retryPending = stillPending.find((row) => row.id === "retry-pending");
    expect(retryPending?.status).toBe("pending");
  });

  test("claimed rows cannot be claimed again", async () => {
    const claimed = await claimDueEmails(25);
    expect(claimed.length).toBe(0);
  });

  test("respects batch size", async () => {
    const now = new Date();
    await db.insert(scheduledEmails).values(
      Array.from({ length: 5 }, (_, i) => ({
        id: `batch-${i}`,
        userId: "user-1",
        recipientEmail: "dest@example.com",
        subject: `batch ${i}`,
        body: "body",
        sendAt: new Date(now.getTime() - 60_000),
        status: "pending" as const,
      })),
    );
    const claimed = await claimDueEmails(3);
    expect(claimed.length).toBe(3);
  });
});

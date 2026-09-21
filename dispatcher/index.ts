import { eq } from "drizzle-orm";
import { client, db, initDb } from "../server/db";
import { scheduledEmails } from "../server/db/schema";
import { claimDueEmails, releaseStaleClaims } from "../server/services/claim";
import { resolveDispatcherProvider } from "../server/services/email";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 60_000);
const CLAIM_BATCH_SIZE = Number(process.env.CLAIM_BATCH_SIZE ?? 25);
const JOB_RETRY_COUNT = Number(process.env.JOB_RETRY_COUNT ?? 3);
const CLAIM_TIMEOUT_MS = Number(process.env.CLAIM_TIMEOUT_MS ?? 300_000);

function backoffMs(attempts: number): number {
  return Math.min(2 ** attempts * 60_000, 3_600_000);
}

async function processTick(
  provider: ReturnType<typeof resolveDispatcherProvider>,
): Promise<void> {
  try {
    const reaped = await releaseStaleClaims(CLAIM_TIMEOUT_MS);
    if (reaped > 0) {
      console.warn(`[dispatcher] released ${reaped} stale claim(s)`);
    }
    const claimed = await claimDueEmails(CLAIM_BATCH_SIZE);
    if (claimed.length > 0) {
      console.log(`[dispatcher] claimed ${claimed.length} email(s)`);
    }
    for (const email of claimed) {
      try {
        await provider.send({
          to: email.recipientEmail,
          subject: email.subject,
          body: email.body,
        });
        await db
          .update(scheduledEmails)
          .set({ status: "delivered", nextRetryAt: null, claimedAt: null })
          .where(eq(scheduledEmails.id, email.id));
        console.log(`[dispatcher] delivered ${email.id}`);
      } catch (error) {
        const attempts = email.attempts + 1;
        if (attempts < JOB_RETRY_COUNT) {
          await db
            .update(scheduledEmails)
            .set({
              status: "pending",
              attempts,
              nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
              claimedAt: null,
            })
            .where(eq(scheduledEmails.id, email.id));
          console.warn(
            `[dispatcher] send failed for ${email.id} (attempt ${attempts}), retrying:`,
            error,
          );
        } else {
          await db
            .update(scheduledEmails)
            .set({
              status: "failed",
              attempts,
              nextRetryAt: null,
              claimedAt: null,
            })
            .where(eq(scheduledEmails.id, email.id));
          console.error(
            `[dispatcher] send failed for ${email.id} permanently (${attempts} attempts):`,
            error,
          );
          try {
            await provider.send({
              to: email.recipientEmail,
              subject: `Delivery failed: ${email.subject}`,
              body: `We could not deliver your scheduled email "${email.subject}" after ${attempts} attempts. It has been marked as failed.`,
            });
          } catch (notifyError) {
            console.error(
              `[dispatcher] failed to send failure notification for ${email.id}:`,
              notifyError,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("[dispatcher] tick failed:", error);
  }
}

async function main(): Promise<void> {
  await initDb();
  // Migrations are paused while the schema is prototyped with `bun run db:push`.
  // Uncomment (and re-import autoMigrateEnabled/runMigrations) once the schema stabilizes.
  // if (autoMigrateEnabled()) {
  //   await runMigrations();
  // }
  const provider = resolveDispatcherProvider();
  console.log(
    `[dispatcher] starting: provider=${provider.name} poll=${POLL_INTERVAL_MS}ms batch=${CLAIM_BATCH_SIZE} retries=${JOB_RETRY_COUNT} claimTimeout=${CLAIM_TIMEOUT_MS}ms`,
  );

  let inFlight: Promise<void> | null = null;
  const runTick = () => {
    inFlight = processTick(provider);
    inFlight.finally(() => {
      inFlight = null;
    });
  };

  runTick();
  const timer = setInterval(runTick, POLL_INTERVAL_MS);

  const shutdown = async (signal: string) => {
    console.log(`[dispatcher] received ${signal}, shutting down...`);
    clearInterval(timer);
    if (inFlight) {
      await inFlight;
    }
    await client.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[dispatcher] fatal:", error);
  process.exit(1);
});

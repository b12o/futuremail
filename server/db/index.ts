import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/futuremail.db",
});

export const db = drizzle({ client });

export async function initDb(): Promise<void> {
  await client.execute("PRAGMA journal_mode = WAL;");
  await migrate(db, { migrationsFolder: "server/db/migrations" });
}

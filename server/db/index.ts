import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL ?? "file:./data/futuremail.db";

if (url.startsWith("file:")) {
  mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
}

export const client = createClient({ url });

export const db = drizzle({ client });

export async function initDb(): Promise<void> {
  await client.execute("PRAGMA journal_mode = WAL;");
  await client.execute("PRAGMA foreign_keys = ON;");
  await client.execute("PRAGMA busy_timeout = 5000;");
}

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: "server/db/migrations" });
}

export function autoMigrateEnabled(): boolean {
  return process.env.DB_AUTO_MIGRATE === "true";
}

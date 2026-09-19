import { autoMigrateEnabled, initDb, runMigrations } from "../db";

export default defineNitroPlugin(async () => {
  await initDb();
  if (autoMigrateEnabled()) {
    await runMigrations();
  }
});

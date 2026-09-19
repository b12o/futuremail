import { initDb } from "../db";

export default defineNitroPlugin(async () => {
  await initDb();
  // Migrations are paused while the schema is prototyped with `bun run db:push`.
  // Uncomment (and re-import autoMigrateEnabled/runMigrations) once the schema stabilizes.
  // if (autoMigrateEnabled()) {
  //   await runMigrations();
  // }
});

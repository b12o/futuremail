import { initDb } from "../db";

export default defineNitroPlugin(async () => {
  await initDb();
});

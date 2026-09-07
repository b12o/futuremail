import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { resolveEmailProvider } from "./services/email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const provider = resolveEmailProvider();
        await provider.send({
          to: email,
          subject: "Sign in to FutureMail",
          body: `Click the link below to sign in to FutureMail:\n\n${url}\n\nThis link expires in 5 minutes.`,
        });
      },
      expiresIn: 300,
    }),
  ],
});

import type { EmailMessage, EmailProvider } from "./index";

// Development mock: pretend every send succeeds instantly so the app can be
// worked on without a real provider. Enabled by MOCK_DISPATCHER=true.
// Recipients ending in @fail.test throw on purpose, keeping the dispatcher's
// retry/permanent-failure paths exercisable while mocked.
const FAILURE_SUFFIX = "@fail.test";

export const mockProvider: EmailProvider = {
  name: "mock",
  async send(message: EmailMessage): Promise<void> {
    if (message.to.endsWith(FAILURE_SUFFIX)) {
      throw new Error(`[email:mock] forced failure for ${message.to}`);
    }
    console.log(
      `[email:mock] delivered (simulated) to=${message.to} subject=${JSON.stringify(message.subject)}`,
    );
  },
};

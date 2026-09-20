import { consoleProvider } from "./console";
import { mockProvider } from "./mock";
import { resendProvider } from "./resend";
import { smtpProvider } from "./smtp";

export { consoleProvider, mockProvider, resendProvider, smtpProvider };

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

export function resolveEmailProvider(): EmailProvider {
  // Development-only override: pretend all sends succeed (see ./mock.ts).
  // Takes precedence over every real provider so it is a single kill switch.
  if (process.env.MOCK_DISPATCHER === "true") {
    return mockProvider;
  }
  if (process.env.RESEND_API_KEY) {
    return resendProvider;
  }
  if (process.env.SMTP_HOST) {
    return smtpProvider;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No email provider configured: set RESEND_API_KEY or SMTP_HOST",
    );
  }
  return consoleProvider;
}

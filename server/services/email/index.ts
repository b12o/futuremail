import { consoleProvider } from "./console";
import { resendProvider } from "./resend";
import { smtpProvider } from "./smtp";

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

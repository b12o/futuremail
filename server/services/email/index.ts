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

/**
 * Real provider selection, shared by every sender: Resend, then SMTP, then
 * (outside production) the console. Never returns the development mock.
 */
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

/**
 * Provider for the dispatcher. Honours the development-only `MOCK_DISPATCHER`
 * override so scheduled mail can be exercised without a real provider. Every
 * other send (e.g. auth OTP) keeps using resolveEmailProvider().
 */
export function resolveDispatcherProvider(): EmailProvider {
  if (process.env.MOCK_DISPATCHER === "true") {
    return mockProvider;
  }
  return resolveEmailProvider();
}

/**
 * Provider for auth email (OTP). Deliberately never mocked, so during
 * development the code falls through to the console and stays visible.
 */
export function resolveAuthEmailProvider(): EmailProvider {
  return resolveEmailProvider();
}

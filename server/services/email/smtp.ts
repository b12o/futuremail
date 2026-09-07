import nodemailer from "nodemailer";
import type { EmailMessage, EmailProvider } from "./index";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
}

export interface MailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface SmtpTransport {
  sendMail(payload: MailPayload): Promise<unknown>;
}

export function smtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return null;
  }
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: user && pass ? { user, pass } : undefined,
  };
}

export function createSmtpProvider(
  createTransport: (config: SmtpConfig) => SmtpTransport,
): EmailProvider {
  return {
    name: "smtp",
    async send(message: EmailMessage): Promise<void> {
      const config = smtpConfigFromEnv();
      if (!config) {
        throw new Error("SMTP_HOST is not set");
      }
      const transport = createTransport(config);
      await transport.sendMail({
        from: process.env.EMAIL_FROM ?? "FutureMail <no-reply@futuremail.local>",
        to: message.to,
        subject: message.subject,
        text: message.body,
      });
    },
  };
}

export const smtpProvider = createSmtpProvider(nodemailer.createTransport);

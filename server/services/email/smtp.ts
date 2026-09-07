import nodemailer from "nodemailer";
import type { EmailMessage, EmailProvider } from "./index";

export const smtpProvider: EmailProvider = {
  name: "smtp",
  async send(message: EmailMessage): Promise<void> {
    const host = process.env.SMTP_HOST;
    if (!host) {
      throw new Error("SMTP_HOST is not set");
    }
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "FutureMail <no-reply@futuremail.local>",
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
  },
};

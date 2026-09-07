import type { EmailMessage, EmailProvider } from "./index";

const API_URL = "https://api.resend.com/emails";

export const resendProvider: EmailProvider = {
  name: "resend",
  async send(message: EmailMessage): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "FutureMail <onboarding@resend.dev>",
        to: [message.to],
        subject: message.subject,
        text: message.body,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Resend send failed (${response.status}): ${await response.text()}`,
      );
    }
  },
};

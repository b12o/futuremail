import type { EmailMessage, EmailProvider } from "./index";

export const consoleProvider: EmailProvider = {
  name: "console",
  async send(message: EmailMessage): Promise<void> {
    console.log(
      `[email:console] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.body}`,
    );
  },
};

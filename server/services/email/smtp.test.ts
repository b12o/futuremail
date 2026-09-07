import { afterEach, describe, expect, test } from "bun:test";
import { createSmtpProvider, smtpConfigFromEnv, smtpProvider } from "./smtp";
import type { SmtpConfig } from "./smtp";

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM",
  ]) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

const message = {
  to: "dest@example.com",
  subject: "Hello",
  body: "World",
};

function fakeTransport(config: SmtpConfig) {
  return {
    config,
    sendMail: async () => ({ messageId: "test" }),
  };
}

describe("smtpConfigFromEnv", () => {
  test("returns null without SMTP_HOST", () => {
    delete process.env.SMTP_HOST;
    expect(smtpConfigFromEnv()).toBeNull();
  });

  test("reads host, port, secure and credentials", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    expect(smtpConfigFromEnv()).toEqual({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "user", pass: "pass" },
    });
  });

  test("omits auth when credentials are missing", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const config = smtpConfigFromEnv();
    expect(config?.auth).toBeUndefined();
  });
});

describe("createSmtpProvider", () => {
  test("throws when SMTP_HOST is not set", async () => {
    delete process.env.SMTP_HOST;
    const provider = createSmtpProvider(fakeTransport);
    expect(provider.send(message)).rejects.toThrow("SMTP_HOST is not set");
  });

  test("sends via the transport with defaults", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    const transports: SmtpConfig[] = [];
    const mails: unknown[] = [];
    const provider = createSmtpProvider((config) => {
      transports.push(config);
      return {
        sendMail: async (mail: unknown) => {
          mails.push(mail);
          return { messageId: "test" };
        },
      };
    });

    await provider.send(message);

    expect(transports.length).toBe(1);
    expect(transports[0]!.host).toBe("smtp.example.com");
    expect(transports[0]!.port).toBe(587);
    expect(transports[0]!.secure).toBe(false);
    expect(transports[0]!.auth).toBeUndefined();

    const mail = mails[0]! as Record<string, unknown>;
    expect(mail.to).toBe(message.to);
    expect(mail.subject).toBe(message.subject);
    expect(mail.text).toBe(message.body);
    expect(mail.from).toBe("FutureMail <no-reply@futuremail.local>");
  });

  test("honors SMTP_PORT, SMTP_SECURE, credentials and EMAIL_FROM", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.EMAIL_FROM = "FutureMail <me@example.com>";

    const transports: SmtpConfig[] = [];
    const mails: unknown[] = [];
    const provider = createSmtpProvider((config) => {
      transports.push(config);
      return {
        sendMail: async (mail: unknown) => {
          mails.push(mail);
          return { messageId: "test" };
        },
      };
    });

    await provider.send(message);

    expect(transports[0]!.port).toBe(465);
    expect(transports[0]!.secure).toBe(true);
    expect(transports[0]!.auth).toEqual({ user: "user", pass: "pass" });

    const mail = mails[0]! as Record<string, unknown>;
    expect(mail.from).toBe("FutureMail <me@example.com>");
  });

  test("real smtpProvider is wired with nodemailer", () => {
    expect(smtpProvider.name).toBe("smtp");
  });
});

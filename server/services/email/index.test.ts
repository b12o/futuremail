import { afterEach, describe, expect, test } from "bun:test";
import { consoleProvider, resolveEmailProvider } from "./index";
import type { EmailProvider } from "./index";

const ENV_KEYS = ["RESEND_API_KEY", "SMTP_HOST", "NODE_ENV"] as const;

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe("resolveEmailProvider", () => {
  test("resolves resend when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    expect(resolveEmailProvider().name).toBe("resend");
  });

  test("resend wins over smtp", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SMTP_HOST = "smtp.example.com";
    expect(resolveEmailProvider().name).toBe("resend");
  });

  test("resolves smtp when only SMTP_HOST is set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    expect(resolveEmailProvider().name).toBe("smtp");
  });

  test("falls back to console outside production", () => {
    process.env.NODE_ENV = "development";
    expect(resolveEmailProvider().name).toBe("console");
  });

  test("throws in production without a provider", () => {
    process.env.NODE_ENV = "production";
    expect(() => resolveEmailProvider()).toThrow(
      "No email provider configured",
    );
  });

  test("all providers satisfy the EmailProvider interface", () => {
    const providers: EmailProvider[] = [
      consoleProvider,
      resolveEmailProvider(),
    ];
    for (const provider of providers) {
      expect(typeof provider.send).toBe("function");
    }
  });
});

describe("consoleProvider", () => {
  test("logs the message", async () => {
    const logs: unknown[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(args);
    try {
      await consoleProvider.send({
        to: "dest@example.com",
        subject: "Hello",
        body: "World",
      });
    } finally {
      console.log = original;
    }
    expect(logs.length).toBe(1);
    expect(String(logs[0])).toContain("dest@example.com");
    expect(String(logs[0])).toContain("Hello");
    expect(String(logs[0])).toContain("World");
  });
});

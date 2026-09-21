import { afterEach, describe, expect, test } from "bun:test";
import {
  consoleProvider,
  mockProvider,
  resolveAuthEmailProvider,
  resolveDispatcherProvider,
  resolveEmailProvider,
} from "./index";
import type { EmailProvider } from "./index";

const ENV_KEYS = [
  "RESEND_API_KEY",
  "SMTP_HOST",
  "NODE_ENV",
  "MOCK_DISPATCHER",
] as const;

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

  test("ignores MOCK_DISPATCHER (dispatcher-only override)", () => {
    process.env.MOCK_DISPATCHER = "true";
    process.env.NODE_ENV = "development";
    expect(resolveEmailProvider().name).toBe("console");
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

describe("resolveDispatcherProvider", () => {
  test("resolves mock when MOCK_DISPATCHER=true", () => {
    process.env.MOCK_DISPATCHER = "true";
    expect(resolveDispatcherProvider().name).toBe("mock");
  });

  test("mock overrides even a configured real provider", () => {
    process.env.MOCK_DISPATCHER = "true";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SMTP_HOST = "smtp.example.com";
    expect(resolveDispatcherProvider().name).toBe("mock");
  });

  test('MOCK_DISPATCHER must be exactly "true"', () => {
    process.env.MOCK_DISPATCHER = "false";
    process.env.RESEND_API_KEY = "re_test_key";
    expect(resolveDispatcherProvider().name).toBe("resend");
  });

  test("falls back to the shared resolver when not mocking", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    expect(resolveDispatcherProvider().name).toBe("resend");
  });
});

describe("resolveAuthEmailProvider", () => {
  test("never mocks, so dev OTP reaches the console", () => {
    process.env.MOCK_DISPATCHER = "true";
    process.env.NODE_ENV = "development";
    expect(resolveAuthEmailProvider().name).toBe("console");
  });

  test("still uses a configured real provider", () => {
    process.env.MOCK_DISPATCHER = "true";
    process.env.RESEND_API_KEY = "re_test_key";
    expect(resolveAuthEmailProvider().name).toBe("resend");
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

describe("mockProvider", () => {
  test("resolves normally for regular recipients", async () => {
    await expect(
      mockProvider.send({
        to: "dest@example.com",
        subject: "Hi",
        body: "Body",
      }),
    ).resolves.toBeUndefined();
  });

  test("throws for @fail.test recipients to exercise retries", async () => {
    await expect(
      mockProvider.send({ to: "dest@fail.test", subject: "Hi", body: "Body" }),
    ).rejects.toThrow("forced failure");
  });
});

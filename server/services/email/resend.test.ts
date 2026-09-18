import { afterEach, describe, expect, test } from "bun:test";
import { resendProvider } from "./resend";

const originalFetch = globalThis.fetch;
const originalKey = process.env.RESEND_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalKey;
  }
});

const message = {
  to: "dest@example.com",
  subject: "Hello",
  body: "World",
};

describe("resendProvider", () => {
  test("throws when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    expect(resendProvider.send(message)).rejects.toThrow(
      "RESEND_API_KEY is not set",
    );
  });

  test("sends via the Resend API on success", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    let captured: Request | undefined;
    globalThis.fetch = (async (input: any, init?: RequestInit) => {
      captured = new Request("https://api.resend.com/emails", init);
      return new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
      });
    }) as typeof fetch;

    await resendProvider.send(message);

    expect(captured?.method).toBe("POST");
    expect(captured?.headers.get("Authorization")).toBe("Bearer re_test_key");
    const payload = (await captured?.json()) as Record<string, unknown>;
    expect(payload.to).toEqual([message.to]);
    expect(payload.subject).toBe(message.subject);
    expect(payload.text).toBe(message.body);
    expect(payload.from).toBe("FutureMail <onboarding@resend.dev>");
  });

  test("uses EMAIL_FROM when set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "FutureMail <me@example.com>";
    let captured: Request | undefined;
    globalThis.fetch = (async (_: any, init?: RequestInit) => {
      captured = new Request("https://api.resend.com/emails", init);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    await resendProvider.send(message);
    const payload = (await captured?.json()) as Record<string, unknown>;
    expect(payload.from).toBe("FutureMail <me@example.com>");
    delete process.env.EMAIL_FROM;
  });

  test("throws on non-ok responses", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    globalThis.fetch = (async () =>
      new Response("Invalid API key", {
        status: 401,
      })) as unknown as typeof fetch;

    expect(resendProvider.send(message)).rejects.toThrow(
      "Resend send failed (401): Invalid API key",
    );
  });
});

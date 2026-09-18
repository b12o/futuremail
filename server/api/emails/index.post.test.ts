import { beforeEach, describe, expect, mock, test } from "bun:test";

interface TestEvent {
  _body?: unknown;
  headers: Headers;
  status?: number;
}

interface TestUser {
  id: string;
  email: string;
}

let session: { user: TestUser } | null = null;
const inserts: Record<string, unknown>[] = [];

mock.module("../../auth", () => ({
  auth: {
    api: {
      getSession: async () => session,
    },
  },
}));

mock.module("../../db", () => ({
  db: {
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => {
          inserts.push(values);
          return [values];
        },
      }),
    }),
  },
}));

const nitro = globalThis as unknown as {
  defineEventHandler: (handler: unknown) => unknown;
  readBody: (event: TestEvent) => Promise<unknown>;
  setResponseStatus: (event: TestEvent, status: number) => void;
  createError: (input: {
    statusCode: number;
    statusMessage: string;
  }) => Error;
};

nitro.defineEventHandler = (handler) => handler;
nitro.readBody = async (event) => event._body;
nitro.setResponseStatus = (event, status) => {
  event.status = status;
};
nitro.createError = ({ statusCode, statusMessage }) =>
  Object.assign(new Error(statusMessage), { statusCode, statusMessage });

const handler = (await import("./index.post")).default as unknown as (
  event: TestEvent,
) => Promise<Record<string, unknown>>;

const SESSION_EMAIL = "me@example.com";
const SESSION_ID = "user-1";

function signIn(email = SESSION_EMAIL): TestUser {
  session = { user: { id: SESSION_ID, email } };
  return session.user;
}

function makeEvent(body: unknown): TestEvent {
  return { _body: body, headers: new Headers() };
}

function futureIso(): string {
  return new Date(Date.now() + 3_600_000).toISOString();
}

function payload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    subject: "Hello, future me",
    body: "This is a time capsule.",
    sendAt: futureIso(),
    ...overrides,
  };
}

beforeEach(() => {
  session = null;
  inserts.length = 0;
});

describe("POST /api/emails recipient lock", () => {
  test("rejects unauthenticated requests before reading the recipient", async () => {
    await expect(handler(makeEvent(payload()))).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(inserts).toHaveLength(0);
  });

  test("rejects a recipient that is not the signed-in user", async () => {
    signIn();
    await expect(
      handler(
        makeEvent(payload({ recipientEmail: "someone-else@example.com" })),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "recipientEmail must be the signed-in user's email",
    });
    expect(inserts).toHaveLength(0);
  });

  test("rejects a spoofed recipient that merely embeds the signed-in email", async () => {
    signIn();
    await expect(
      handler(
        makeEvent(payload({ recipientEmail: "me@example.com.attacker.io" })),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(inserts).toHaveLength(0);
  });

  test("rejects a non-string recipientEmail", async () => {
    signIn();
    await expect(
      handler(makeEvent(payload({ recipientEmail: 12345 }))),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(inserts).toHaveLength(0);
  });

  test("locks to the session email when recipientEmail is omitted", async () => {
    signIn();
    const event = makeEvent(payload());
    const row = await handler(event);
    expect(event.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.recipientEmail).toBe(SESSION_EMAIL);
    expect(inserts[0]!.userId).toBe(SESSION_ID);
    expect(row.recipientEmail).toBe(SESSION_EMAIL);
  });

  test("accepts a recipientEmail matching the signed-in user", async () => {
    signIn();
    const event = makeEvent(payload({ recipientEmail: SESSION_EMAIL }));
    const row = await handler(event);
    expect(event.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(row.recipientEmail).toBe(SESSION_EMAIL);
  });

  test("matches the recipient case-insensitively and trims whitespace", async () => {
    signIn();
    const event = makeEvent(payload({ recipientEmail: "  ME@Example.COM  " }));
    const row = await handler(event);
    expect(event.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.recipientEmail).toBe(SESSION_EMAIL);
    expect(row.recipientEmail).toBe(SESSION_EMAIL);
  });

  test("uses the current session email for each request", async () => {
    signIn("first@example.com");
    await handler(makeEvent(payload()));
    signIn("second@example.com");
    await handler(makeEvent(payload()));
    expect(inserts.map((row) => row.recipientEmail)).toEqual([
      "first@example.com",
      "second@example.com",
    ]);
  });
});

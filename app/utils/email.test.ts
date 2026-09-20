import { describe, expect, test } from "bun:test";
import { MAX_EMAIL_LENGTH, truncateEmail } from "./email";

describe("truncateEmail", () => {
  test("returns short emails unchanged", () => {
    expect(truncateEmail("a@b.com")).toBe("a@b.com");
  });

  test("returns an email of exactly the max length unchanged", () => {
    const email = `${"a".repeat(MAX_EMAIL_LENGTH - 2)}@b`;
    expect(email.length).toBe(MAX_EMAIL_LENGTH);
    expect(truncateEmail(email)).toBe(email);
  });

  test("truncates one character over the max", () => {
    const email = `${"a".repeat(MAX_EMAIL_LENGTH - 1)}@b`;
    expect(email.length).toBe(MAX_EMAIL_LENGTH + 1);
    expect(truncateEmail(email)).toBe(`${email.slice(0, MAX_EMAIL_LENGTH)}…`);
  });

  test("honors a custom max", () => {
    const email = `${"a".repeat(80)}@example.com`;
    expect(truncateEmail(email, 80)).toBe(`${email.slice(0, 80)}…`);
  });

  test("does not truncate when custom max exceeds length", () => {
    expect(truncateEmail("a@b.com", 80)).toBe("a@b.com");
  });
});

import { describe, expect, test } from "bun:test";
import { OTP_EXPIRES_IN_SECONDS, OTP_LENGTH, buildOtpEmail } from "./messages";

describe("buildOtpEmail", () => {
  const message = buildOtpEmail({ to: "dest@example.com", otp: "135790" });

  test("targets the recipient", () => {
    expect(message.to).toBe("dest@example.com");
  });

  test("has a sign-in subject", () => {
    expect(message.subject).toBe("Your FutureMail sign-in code");
  });

  test("includes the code", () => {
    expect(message.body).toContain("135790");
  });

  test("states the expiry window", () => {
    const minutes = Math.round(OTP_EXPIRES_IN_SECONDS / 60);
    expect(message.body).toContain(`expires in ${minutes} minutes`);
  });

  test("tells the recipient to ignore unexpected mail", () => {
    expect(message.body).toContain("ignore this email");
  });

  test("contains no link, so it works without inbound reachability", () => {
    expect(message.body).not.toMatch(/https?:\/\//);
  });

  test("ships a 6-digit default code length", () => {
    expect(OTP_LENGTH).toBe(6);
  });
});

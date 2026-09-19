import type { EmailMessage } from "./index";

export const OTP_LENGTH = 6;
export const OTP_EXPIRES_IN_SECONDS = 300;
export const OTP_ALLOWED_ATTEMPTS = 3;

export function buildOtpEmail(input: {
  to: string;
  otp: string;
}): EmailMessage {
  const minutes = Math.round(OTP_EXPIRES_IN_SECONDS / 60);
  return {
    to: input.to,
    subject: "Your FutureMail sign-in code",
    body: [
      "Your FutureMail sign-in code is:",
      "",
      input.otp,
      "",
      `It expires in ${minutes} minutes.`,
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
  };
}

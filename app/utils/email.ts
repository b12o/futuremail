export const MAX_EMAIL_LENGTH = 45;

export function truncateEmail(email: string, max = MAX_EMAIL_LENGTH): string {
  return email.length > max ? `${email.slice(0, max)}…` : email;
}

export type EmailStatus = "pending" | "sending" | "delivered" | "failed"

export interface ScheduledEmail {
  id: string
  recipientEmail: string
  isEncrypted: boolean
  sendAt: string
  status: EmailStatus
  attempts: number
  nextRetryAt: string | null
  createdAt: string
  subject: string | null
  body: string | null
}

export interface SessionUser {
  id: string
  email: string
  name?: string
}

export type SessionData = {
  session: { id: string; expiresAt: string }
  user: SessionUser
} | null

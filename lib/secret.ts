import { timingSafeEqual } from 'node:crypto'

export function matchesWebhookSecret(candidate: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expected || !candidate) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

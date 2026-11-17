import { handleMessage } from '@/lib/bot'
import { matchesWebhookSecret } from '@/lib/secret'
import { sendMessage, type TelegramUpdate } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  if (!matchesWebhookSecret(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const message = update.message
  if (message) {
    try {
      await handleMessage(message)
    } catch (error) {
      console.error('Telegram update failed', error)
      await sendMessage(message.chat.id, 'Something went wrong. Please try again.').catch(() => {})
    }
  }

  // Always acknowledge so Telegram does not retry the same update forever.
  return Response.json({ ok: true })
}

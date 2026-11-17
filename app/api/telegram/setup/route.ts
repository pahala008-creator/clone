import { BOT_COMMANDS } from '@/lib/bot'
import { matchesWebhookSecret } from '@/lib/secret'
import { callTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (!matchesWebhookSecret(url.searchParams.get('key'))) {
    return Response.json({ ok: false, error: 'Invalid or missing key' }, { status: 401 })
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return Response.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 500 })
  }

  const host = request.headers.get('x-forwarded-host') ?? url.host
  const webhookUrl = `https://${host}/api/telegram`

  try {
    await callTelegram('setWebhook', {
      url: webhookUrl,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    })
    await callTelegram('setMyCommands', { commands: BOT_COMMANDS })
    return Response.json({ ok: true, webhookUrl })
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 502 })
  }
}

import { BOT_COMMANDS } from '@/lib/bot'
import { getCounts } from '@/lib/contacts'
import { SetupSteps } from '@/components/setup-steps'
import { StatCards } from '@/components/stat-cards'
import { StatusList, type StatusItem } from '@/components/status-list'

export const dynamic = 'force-dynamic'

async function loadCounts() {
  try {
    return await getCounts()
  } catch (error) {
    console.error('Database check failed', error)
    return null
  }
}

export default async function Page() {
  const counts = await loadCounts()

  const status: StatusItem[] = [
    {
      label: 'Database',
      ok: counts !== null,
      detail: counts !== null ? 'Connected to Neon Postgres.' : 'Could not reach the database. Check DATABASE_URL.',
    },
    {
      label: 'Bot token',
      ok: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      detail: process.env.TELEGRAM_BOT_TOKEN ? 'TELEGRAM_BOT_TOKEN is set.' : 'Add TELEGRAM_BOT_TOKEN from @BotFather.',
    },
    {
      label: 'Owner',
      ok: Boolean(process.env.TELEGRAM_OWNER_ID),
      detail: process.env.TELEGRAM_OWNER_ID
        ? 'Only the configured owner can use the bot.'
        : 'Add TELEGRAM_OWNER_ID (your numeric Telegram user ID).',
    },
    {
      label: 'Webhook secret',
      ok: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      detail: process.env.TELEGRAM_WEBHOOK_SECRET
        ? 'Incoming webhook calls are verified.'
        : 'Add TELEGRAM_WEBHOOK_SECRET (a long random string).',
    },
  ]

  const ready = status.every((s) => s.ok)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-5 py-12 md:py-16">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted">
          <span aria-hidden="true" className={`size-1.5 rounded-full ${ready ? 'bg-ok' : 'bg-warn'}`} />
          {ready ? 'Ready' : 'Setup incomplete'}
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Contact Manager Bot</h1>
        <p className="max-w-xl text-pretty leading-relaxed text-muted">
          An owner-only Telegram bot for keeping your own list of phone numbers and usernames. Add entries by message
          or file, then list, count, export or delete them. It stores data only and never looks anything up on
          Telegram.
        </p>
      </header>

      <section aria-labelledby="stats-heading" className="flex flex-col gap-4">
        <h2 id="stats-heading" className="text-sm font-medium uppercase tracking-wider text-muted">
          Saved contacts
        </h2>
        <StatCards counts={counts} />
      </section>

      <section aria-labelledby="status-heading" className="flex flex-col gap-4">
        <h2 id="status-heading" className="text-sm font-medium uppercase tracking-wider text-muted">
          Configuration
        </h2>
        <StatusList items={status} />
      </section>

      <section aria-labelledby="setup-heading" className="flex flex-col gap-4">
        <h2 id="setup-heading" className="text-sm font-medium uppercase tracking-wider text-muted">
          Connect the bot
        </h2>
        <SetupSteps />
      </section>

      <section aria-labelledby="commands-heading" className="flex flex-col gap-4">
        <h2 id="commands-heading" className="text-sm font-medium uppercase tracking-wider text-muted">
          Commands
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BOT_COMMANDS.map((c) => (
            <li key={c.command} className="flex flex-col gap-0.5 rounded-lg border border-border bg-surface px-4 py-3">
              <code className="font-mono text-sm text-accent">/{c.command}</code>
              <span className="text-sm text-muted">{c.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

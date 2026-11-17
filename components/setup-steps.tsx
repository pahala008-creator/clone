export function SetupSteps() {
  return (
    <ol className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
      <li className="flex gap-3">
        <span className="font-mono text-accent">1.</span>
        <span>
          In @BotFather, revoke any token that was ever shared or committed and create a fresh one.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="font-mono text-accent">2.</span>
        <span>
          Add <code className="font-mono text-foreground">TELEGRAM_BOT_TOKEN</code>,{' '}
          <code className="font-mono text-foreground">TELEGRAM_OWNER_ID</code> and{' '}
          <code className="font-mono text-foreground">TELEGRAM_WEBHOOK_SECRET</code> in the project&apos;s environment
          variables, then publish.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="font-mono text-accent">3.</span>
        <span>
          Open{' '}
          <code className="break-all font-mono text-foreground">
            {'https://<your-domain>/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>'}
          </code>{' '}
          once on the published site to register the webhook and command menu.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="font-mono text-accent">4.</span>
        <span>Message your bot /help from the owner account. Messages from anyone else are ignored.</span>
      </li>
    </ol>
  )
}

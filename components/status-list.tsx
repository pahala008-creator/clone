export type StatusItem = { label: string; ok: boolean; detail: string }

export function StatusList({ items }: { items: StatusItem[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className={`mt-1.5 size-2 shrink-0 rounded-full ${item.ok ? 'bg-ok' : 'bg-warn'}`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">
              {item.label}
              <span className="sr-only">{item.ok ? ' (ready)' : ' (needs setup)'}</span>
            </span>
            <span className="text-sm text-muted">{item.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

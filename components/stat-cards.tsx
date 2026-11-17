type Counts = { total: number; phone: number; username: number } | null

export function StatCards({ counts }: { counts: Counts }) {
  const stats = [
    { label: 'Total contacts', value: counts?.total },
    { label: 'Phone numbers', value: counts?.phone },
    { label: 'Usernames', value: counts?.username },
  ]

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-4">
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd className="font-mono text-2xl font-semibold tabular-nums">{stat.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

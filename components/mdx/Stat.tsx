type StatProps = {
  label: string
  value: string
  note?: string
}

export default function Stat({
  label,
  value,
  note,
}: StatProps) {
  return (
    <section className="mt-4 border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--site-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-light tracking-tight text-[color:var(--site-heading)]">{value}</p>
      {note && <p className="mt-1 text-xs text-[color:var(--site-muted)]">{note}</p>}
    </section>
  )
}

type StatProps = {
  label: string
  value: string
  note?: string
}

export default function Stat({ label, value, note }: StatProps) {
  return (
    <section className="mt-4 border border-gray-800 bg-gray-900/30 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-light tracking-tight text-gray-100">{value}</p>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </section>
  )
}

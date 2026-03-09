import type { CommodityPoint } from '@/lib/prices/types'

type PriceStatCardProps = {
  item: CommodityPoint
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return 'Unavailable'
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value)} ${unit}`
}

function formatUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) return 'No timestamp'

  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
}

function statusClassName(status: CommodityPoint['status']): string {
  if (status === 'ok') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  if (status === 'fallback') return 'text-amber-300 border-amber-500/30 bg-amber-500/10'
  return 'text-rose-300 border-rose-500/30 bg-rose-500/10'
}

export default function PriceStatCard({ item }: PriceStatCardProps) {
  return (
    <article className="border border-gray-800 bg-gray-900/40 p-4 rounded-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-light tracking-tight text-gray-100">{item.label}</h3>
        <span className={`border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${statusClassName(item.status)}`}>
          {item.status}
        </span>
      </div>

      <p className="mt-3 text-2xl font-light tracking-tight text-gray-100">{formatValue(item.value, item.unit)}</p>

      <div className="mt-3 space-y-1">
        <p className="text-xs font-light text-gray-500">Source: {item.source}</p>
        <p className="text-xs font-light text-gray-500">Updated: {formatUpdatedAt(item.updatedAt)} UTC</p>
        {item.note && <p className="text-xs font-light text-gray-400">{item.note}</p>}
      </div>
    </article>
  )
}

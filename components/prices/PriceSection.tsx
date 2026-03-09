import PriceStatCard from '@/components/prices/PriceStatCard'
import type { CommodityPoint } from '@/lib/prices/types'

type PriceSectionProps = {
  title: string
  description: string
  items: CommodityPoint[]
}

export default function PriceSection({ title, description, items }: PriceSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-light tracking-tight text-gray-100">{title}</h2>
        <p className="text-sm font-light text-gray-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <PriceStatCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}


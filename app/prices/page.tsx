import type { Metadata } from 'next'
import PageHeader from '@/components/prices/PageHeader'
import PriceSection from '@/components/prices/PriceSection'
import { getDailyCommodityPrices } from '@/lib/prices/getDailyCommodityPrices'

export const metadata: Metadata = {
  title: 'Commodity Prices by Market',
  description: 'International benchmarks, major economic regions, and Vietnam-equivalent commodity prices.',
}

export const revalidate = 86400

export default async function PricesPage() {
  const data = await getDailyCommodityPrices()

  const goldItems = data.items.filter((item) => item.category === 'gold')
  const energyItems = data.items.filter((item) => item.category === 'energy')
  const foodItems = data.items.filter((item) => item.category === 'food')

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-4xl space-y-12">
        <PageHeader generatedAt={data.generatedAt} />

        {data.errors.length > 0 && (
          <section className="border border-amber-700/40 bg-amber-950/20 p-4 rounded-sm">
            <h2 className="text-sm font-light tracking-tight text-amber-200">Some sources are unavailable</h2>
            <ul className="mt-2 space-y-1">
              {data.errors.map((error) => (
                <li key={`${error.source}-${error.reason}`} className="text-xs font-light text-amber-100/90">
                  {error.source}: {error.reason}
                </li>
              ))}
            </ul>
          </section>
        )}

        <PriceSection
          title="Gold"
          description="International spot plus FX-converted benchmarks for Euro Area, China, Japan, and Vietnam."
          items={goldItems}
        />

        <PriceSection
          title="Energy"
          description="WTI and US gasoline benchmarks plus FX-converted crude-equivalent prices by major regions and Vietnam."
          items={energyItems}
        />

        <PriceSection
          title="Food"
          description="International rice benchmark (Thailand 5%) plus FX-converted equivalents for major regions and Vietnam."
          items={foodItems}
        />
      </div>
    </main>
  )
}

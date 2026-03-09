import 'server-only'
import { fetchEnergyBenchmarks, fetchFoodIndex, fetchGoldPrice } from '@/lib/prices/providers'
import type { CommodityPoint, FetchStatus, PricesError, PricesPageData } from '@/lib/prices/types'

type ProviderName = 'alpha' | 'fredEnergy' | 'fredFood'

const FALLBACK_POINTS: Record<ProviderName, CommodityPoint[]> = {
  alpha: [
    {
      id: 'gold-intl-usd',
      label: 'Gold Spot (International)',
      category: 'gold',
      value: null,
      unit: 'USD/oz',
      source: 'Alpha Vantage (XAU/USD)',
      updatedAt: null,
      status: 'fallback',
      note: 'Live value unavailable.',
    },
    {
      id: 'gold-euro-area',
      label: 'Gold Spot (Euro Area)',
      category: 'gold',
      value: null,
      unit: 'EUR/oz',
      source: 'Derived from XAU/USD + FRED (DEXUSEU)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'gold-china',
      label: 'Gold Spot (China)',
      category: 'gold',
      value: null,
      unit: 'CNY/oz',
      source: 'Derived from XAU/USD + FRED (DEXCHUS)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'gold-japan',
      label: 'Gold Spot (Japan)',
      category: 'gold',
      value: null,
      unit: 'JPY/oz',
      source: 'Derived from XAU/USD + FRED (DEXJPUS)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'gold-vietnam',
      label: 'Gold Spot (Vietnam)',
      category: 'gold',
      value: null,
      unit: 'VND/oz',
      source: 'Derived from XAU/USD + FRED (DEXVND)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
  ],
  fredEnergy: [
    {
      id: 'energy-intl-wti',
      label: 'Crude Oil (WTI, International)',
      category: 'energy',
      value: null,
      unit: 'USD/barrel',
      source: 'FRED (DCOILWTICO)',
      updatedAt: null,
      status: 'fallback',
      note: 'Live value unavailable.',
    },
    {
      id: 'energy-us-gasoline',
      label: 'US Regular Gasoline',
      category: 'energy',
      value: null,
      unit: 'USD/gallon',
      source: 'FRED (GASREGW)',
      updatedAt: null,
      status: 'fallback',
      note: 'Live value unavailable.',
    },
    {
      id: 'energy-euro-area-wti',
      label: 'Crude Oil Equivalent (Euro Area)',
      category: 'energy',
      value: null,
      unit: 'EUR/liter',
      source: 'Derived from WTI + FRED (DEXUSEU)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'energy-china-wti',
      label: 'Crude Oil Equivalent (China)',
      category: 'energy',
      value: null,
      unit: 'CNY/liter',
      source: 'Derived from WTI + FRED (DEXCHUS)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'energy-japan-wti',
      label: 'Crude Oil Equivalent (Japan)',
      category: 'energy',
      value: null,
      unit: 'JPY/liter',
      source: 'Derived from WTI + FRED (DEXJPUS)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'energy-vietnam-wti',
      label: 'Crude Oil Equivalent (Vietnam)',
      category: 'energy',
      value: null,
      unit: 'VND/liter',
      source: 'Derived from WTI + FRED (DEXVND)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
  ],
  fredFood: [
    {
      id: 'food-intl-rice',
      label: 'Rice Price (International, Thailand 5%)',
      category: 'food',
      value: null,
      unit: 'USD/metric ton',
      source: 'FRED (PRICENPQUSDM)',
      updatedAt: null,
      status: 'fallback',
      note: 'Latest published value unavailable.',
    },
    {
      id: 'food-euro-area-rice',
      label: 'Rice Equivalent (Euro Area)',
      category: 'food',
      value: null,
      unit: 'EUR/kg',
      source: 'Derived from rice benchmark + FRED (DEXUSEU)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'food-china-rice',
      label: 'Rice Equivalent (China)',
      category: 'food',
      value: null,
      unit: 'CNY/kg',
      source: 'Derived from rice benchmark + FRED (DEXCHUS)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'food-japan-rice',
      label: 'Rice Equivalent (Japan)',
      category: 'food',
      value: null,
      unit: 'JPY/kg',
      source: 'Derived from rice benchmark + FRED (DEXJPUS)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
    {
      id: 'food-vietnam-rice',
      label: 'Rice Equivalent (Vietnam)',
      category: 'food',
      value: null,
      unit: 'VND/kg',
      source: 'Derived from rice benchmark + FRED (DEXVND)',
      updatedAt: null,
      status: 'fallback',
      note: 'FX-converted benchmark unavailable.',
    },
  ],
}

function toReason(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function resolveFallbackStatus(reason: string): FetchStatus {
  if (reason.startsWith('Missing ')) {
    return 'fallback'
  }
  return 'unavailable'
}

function withFallbackStatus(points: CommodityPoint[], status: FetchStatus, reason: string): CommodityPoint[] {
  return points.map((point) => ({
    ...point,
    status,
    note: status === 'fallback' ? point.note : `Source unavailable: ${reason}`,
  }))
}

function sortByDisplayOrder(items: CommodityPoint[]): CommodityPoint[] {
  const order = [
    'gold-intl-usd',
    'gold-euro-area',
    'gold-china',
    'gold-japan',
    'gold-vietnam',
    'energy-intl-wti',
    'energy-us-gasoline',
    'energy-euro-area-wti',
    'energy-china-wti',
    'energy-japan-wti',
    'energy-vietnam-wti',
    'food-intl-rice',
    'food-euro-area-rice',
    'food-china-rice',
    'food-japan-rice',
    'food-vietnam-rice',
  ]
  return [...items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
}

export async function getDailyCommodityPrices(): Promise<PricesPageData> {
  const [goldResult, energyResult, foodResult] = await Promise.allSettled([
    fetchGoldPrice(),
    fetchEnergyBenchmarks(),
    fetchFoodIndex(),
  ])

  const items: CommodityPoint[] = []
  const errors: PricesError[] = []

  if (goldResult.status === 'fulfilled') {
    items.push(...goldResult.value.items)
  } else {
    const reason = toReason(goldResult.reason)
    const status = resolveFallbackStatus(reason)
    errors.push({ source: 'Alpha Vantage', reason })
    items.push(...withFallbackStatus(FALLBACK_POINTS.alpha, status, reason))
  }

  if (energyResult.status === 'fulfilled') {
    items.push(...energyResult.value.items)
  } else {
    const reason = toReason(energyResult.reason)
    const status = resolveFallbackStatus(reason)
    errors.push({ source: 'FRED Energy', reason })
    items.push(...withFallbackStatus(FALLBACK_POINTS.fredEnergy, status, reason))
  }

  if (foodResult.status === 'fulfilled') {
    items.push(...foodResult.value.items)
  } else {
    const reason = toReason(foodResult.reason)
    const status = resolveFallbackStatus(reason)
    errors.push({ source: 'FRED Food', reason })
    items.push(...withFallbackStatus(FALLBACK_POINTS.fredFood, status, reason))
  }

  return {
    generatedAt: new Date().toISOString(),
    items: sortByDisplayOrder(items),
    errors,
  }
}

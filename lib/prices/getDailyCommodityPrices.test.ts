import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prices/providers')

import { getDailyCommodityPrices } from '@/lib/prices/getDailyCommodityPrices'
import { fetchGoldPrice, fetchEnergyBenchmarks, fetchFoodIndex } from '@/lib/prices/providers'
import type { CommodityPoint } from '@/lib/prices/types'

const mockFetchGoldPrice = vi.mocked(fetchGoldPrice)
const mockFetchEnergyBenchmarks = vi.mocked(fetchEnergyBenchmarks)
const mockFetchFoodIndex = vi.mocked(fetchFoodIndex)

function makePoint(id: string, category: CommodityPoint['category']): CommodityPoint {
  return {
    id,
    label: id,
    category,
    value: 100,
    unit: 'USD',
    source: 'test',
    updatedAt: '2024-01-01T00:00:00.000Z',
    status: 'ok',
  }
}

const GOLD_ITEMS: CommodityPoint[] = [
  makePoint('gold-intl-usd', 'gold'),
  makePoint('gold-euro-area', 'gold'),
  makePoint('gold-china', 'gold'),
  makePoint('gold-japan', 'gold'),
  makePoint('gold-vietnam', 'gold'),
]

const ENERGY_ITEMS: CommodityPoint[] = [
  makePoint('energy-intl-wti', 'energy'),
  makePoint('energy-us-gasoline', 'energy'),
  makePoint('energy-euro-area-wti', 'energy'),
  makePoint('energy-china-wti', 'energy'),
  makePoint('energy-japan-wti', 'energy'),
  makePoint('energy-vietnam-wti', 'energy'),
]

const FOOD_ITEMS: CommodityPoint[] = [
  makePoint('food-intl-rice', 'food'),
  makePoint('food-euro-area-rice', 'food'),
  makePoint('food-china-rice', 'food'),
  makePoint('food-japan-rice', 'food'),
  makePoint('food-vietnam-rice', 'food'),
]

describe('getDailyCommodityPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns no errors and all items when all providers succeed', async () => {
    mockFetchGoldPrice.mockResolvedValue({ provider: 'alpha', items: GOLD_ITEMS })
    mockFetchEnergyBenchmarks.mockResolvedValue({ provider: 'fred', items: ENERGY_ITEMS })
    mockFetchFoodIndex.mockResolvedValue({ provider: 'fred', items: FOOD_ITEMS })

    const result = await getDailyCommodityPrices()

    expect(result.errors).toHaveLength(0)
    expect(result.items).toHaveLength(16)
    expect(result.generatedAt).toBeTruthy()
  })

  it('assigns "fallback" status when error starts with "Missing "', async () => {
    mockFetchGoldPrice.mockRejectedValue(new Error('Missing ALPHA_VANTAGE_API_KEY'))
    mockFetchEnergyBenchmarks.mockResolvedValue({ provider: 'fred', items: ENERGY_ITEMS })
    mockFetchFoodIndex.mockResolvedValue({ provider: 'fred', items: FOOD_ITEMS })

    const result = await getDailyCommodityPrices()

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({ source: 'Alpha Vantage', reason: 'Missing ALPHA_VANTAGE_API_KEY' })

    const goldItems = result.items.filter((item) => item.category === 'gold')
    expect(goldItems.length).toBeGreaterThan(0)
    goldItems.forEach((item) => expect(item.status).toBe('fallback'))
  })

  it('assigns "unavailable" status for non-missing errors', async () => {
    mockFetchGoldPrice.mockRejectedValue(new Error('Network timeout'))
    mockFetchEnergyBenchmarks.mockResolvedValue({ provider: 'fred', items: ENERGY_ITEMS })
    mockFetchFoodIndex.mockResolvedValue({ provider: 'fred', items: FOOD_ITEMS })

    const result = await getDailyCommodityPrices()

    const goldItems = result.items.filter((item) => item.category === 'gold')
    goldItems.forEach((item) => expect(item.status).toBe('unavailable'))
    expect(result.items.find((i) => i.id === 'gold-intl-usd')?.note).toContain('Network timeout')
  })

  it('collects one error per failing provider', async () => {
    mockFetchGoldPrice.mockRejectedValue(new Error('alpha fail'))
    mockFetchEnergyBenchmarks.mockRejectedValue(new Error('fred energy fail'))
    mockFetchFoodIndex.mockRejectedValue(new Error('fred food fail'))

    const result = await getDailyCommodityPrices()

    expect(result.errors).toHaveLength(3)
    expect(result.errors.map((e) => e.source)).toEqual(['Alpha Vantage', 'FRED Energy', 'FRED Food'])
  })

  it('still returns all 16 fallback items when all providers fail', async () => {
    mockFetchGoldPrice.mockRejectedValue(new Error('Missing ALPHA_VANTAGE_API_KEY'))
    mockFetchEnergyBenchmarks.mockRejectedValue(new Error('Missing FRED_API_KEY'))
    mockFetchFoodIndex.mockRejectedValue(new Error('Missing FRED_API_KEY'))

    const result = await getDailyCommodityPrices()

    expect(result.items).toHaveLength(16)
  })

  it('returns items in the correct display order', async () => {
    mockFetchGoldPrice.mockResolvedValue({ provider: 'alpha', items: [...GOLD_ITEMS].reverse() })
    mockFetchEnergyBenchmarks.mockResolvedValue({ provider: 'fred', items: [...ENERGY_ITEMS].reverse() })
    mockFetchFoodIndex.mockResolvedValue({ provider: 'fred', items: [...FOOD_ITEMS].reverse() })

    const result = await getDailyCommodityPrices()

    const ids = result.items.map((i) => i.id)
    expect(ids).toEqual([
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
    ])
  })

  it('includes a valid ISO timestamp in generatedAt', async () => {
    mockFetchGoldPrice.mockResolvedValue({ provider: 'alpha', items: GOLD_ITEMS })
    mockFetchEnergyBenchmarks.mockResolvedValue({ provider: 'fred', items: ENERGY_ITEMS })
    mockFetchFoodIndex.mockResolvedValue({ provider: 'fred', items: FOOD_ITEMS })

    const result = await getDailyCommodityPrices()

    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt)
  })
})

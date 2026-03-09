export type CommodityCategory = 'gold' | 'energy' | 'food'

export type FetchStatus = 'ok' | 'fallback' | 'unavailable'

export type CommodityTrend = 'up' | 'down' | 'flat'

export type CommodityPoint = {
  id: string
  label: string
  category: CommodityCategory
  value: number | null
  unit: string
  source: string
  updatedAt: string | null
  status: FetchStatus
  note?: string
  trend?: CommodityTrend
}

export type PricesError = {
  source: string
  reason: string
}

export type PricesPageData = {
  generatedAt: string
  items: CommodityPoint[]
  errors: PricesError[]
}

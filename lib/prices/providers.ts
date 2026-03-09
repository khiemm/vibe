import 'server-only'
import type { CommodityPoint, FetchStatus } from '@/lib/prices/types'

const REQUEST_TIMEOUT_MS = 10_000
const ENABLE_PROVIDER_LOGS = process.env.PRICES_API_LOGS !== '0'

type ProviderName = 'alpha' | 'fred'

type ProviderResult = {
  provider: ProviderName
  items: CommodityPoint[]
}

type FredObservation = {
  date: string
  value: string
}

type FredSeriesResult = {
  seriesId: string
  date: string
  value: number
}

type FxQuoteMode = 'localPerUsd' | 'usdPerLocal'

type FxQuote = {
  seriesId: string
  region: 'euro-area' | 'china' | 'japan' | 'vietnam'
  label: string
  mode: FxQuoteMode
}

const FX_QUOTES: FxQuote[] = [
  { seriesId: 'DEXUSEU', region: 'euro-area', label: 'Euro Area', mode: 'usdPerLocal' },
  { seriesId: 'DEXCHUS', region: 'china', label: 'China', mode: 'localPerUsd' },
  { seriesId: 'DEXJPUS', region: 'japan', label: 'Japan', mode: 'localPerUsd' },
  { seriesId: 'DEXVND', region: 'vietnam', label: 'Vietnam', mode: 'localPerUsd' },
]

const LITERS_PER_BARREL = 158.987294928
const KG_PER_METRIC_TON = 1_000

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function redactUrlForLogs(input: string): string {
  try {
    const parsed = new URL(input)
    for (const key of ['apikey', 'api_key', 'access_key']) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, 'REDACTED')
      }
    }
    return parsed.toString()
  } catch {
    return input.replace(/((?:apikey|api_key|access_key)=)[^&]+/gi, '$1REDACTED')
  }
}

function logRequest(event: string, payload: Record<string, unknown>): void {
  if (!ENABLE_PROVIDER_LOGS) return
  console.info(`[prices] ${event}`, payload)
}

function toIsoDate(input?: string | number | null): string | null {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return new Date(input * 1000).toISOString()
  }

  if (typeof input === 'string' && input.trim()) {
    const candidate = new Date(input)
    if (!Number.isNaN(candidate.getTime())) {
      return candidate.toISOString()
    }
  }

  return null
}

function toStatusFromError(error: unknown): FetchStatus {
  const reason = toErrorMessage(error)
  if (reason.startsWith('Missing ')) return 'fallback'
  return 'unavailable'
}

function toCurrencyPerUsd(fxValue: number, mode: FxQuoteMode): number {
  if (mode === 'localPerUsd') return fxValue
  return 1 / fxValue
}

function safeRound(value: number): number {
  return Math.round(value * 1_000) / 1_000
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = Date.now()
  const safeUrl = redactUrlForLogs(url)

  logRequest('request:start', {
    url: safeUrl,
    timeoutMs: REQUEST_TIMEOUT_MS,
  })

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    })

    logRequest('request:response', {
      url: safeUrl,
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return (await response.json()) as T
  } catch (error) {
    logRequest('request:error', {
      url: safeUrl,
      error: toErrorMessage(error),
      durationMs: Date.now() - startedAt,
    })

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchLatestFredObservation(seriesId: string): Promise<FredSeriesResult> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    throw new Error('Missing FRED_API_KEY')
  }

  const endpoint =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=24`

  const payload = await fetchJsonWithTimeout<{ observations?: FredObservation[] }>(endpoint)
  const observations = payload.observations

  if (!Array.isArray(observations)) {
    throw new Error(`Invalid FRED response for ${seriesId}`)
  }

  const latest = observations.find((entry) => {
    const numeric = Number.parseFloat(entry.value)
    return Number.isFinite(numeric)
  })

  if (!latest) {
    throw new Error(`No numeric observation for ${seriesId}`)
  }

  return {
    seriesId,
    date: latest.date,
    value: Number.parseFloat(latest.value),
  }
}

async function fetchFxQuotes(): Promise<Map<FxQuote['region'], FredSeriesResult>> {
  const settled = await Promise.allSettled(FX_QUOTES.map((quote) => fetchLatestFredObservation(quote.seriesId)))
  const fxByRegion = new Map<FxQuote['region'], FredSeriesResult>()

  settled.forEach((result, index) => {
    const quote = FX_QUOTES[index]
    if (result.status === 'fulfilled') {
      fxByRegion.set(quote.region, result.value)
    } else {
      logRequest('fx:missing', {
        seriesId: quote.seriesId,
        region: quote.region,
        reason: toErrorMessage(result.reason),
      })
    }
  })

  return fxByRegion
}

export async function fetchGoldPrice(): Promise<ProviderResult> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    throw new Error('Missing ALPHA_VANTAGE_API_KEY')
  }

  const endpoint =
    'https://www.alphavantage.co/query' +
    `?function=GOLD_SILVER_SPOT&symbol=GOLD&apikey=${apiKey}`

  const payload = await fetchJsonWithTimeout<{
    nominal?: string
    timestamp?: string
    price?: string
    Note?: string
    Information?: string
    'Error Message'?: string
  }>(endpoint)

  if (payload['Error Message']) {
    throw new Error(payload['Error Message'])
  }

  if (payload.Information || payload.Note) {
    throw new Error(payload.Information ?? payload.Note ?? 'Alpha Vantage returned an informational response')
  }

  const xauUsd = Number.parseFloat(payload.price ?? '')
  if (!Number.isFinite(xauUsd) || xauUsd <= 0) {
    throw new Error('Invalid XAUUSD exchange rate from Alpha Vantage')
  }

  const updatedAt = toIsoDate(payload.timestamp)
  const items: CommodityPoint[] = [
    {
      id: 'gold-intl-usd',
      label: 'Gold Spot (International)',
      category: 'gold',
      value: safeRound(xauUsd),
      unit: 'USD/oz',
      source: 'Alpha Vantage (XAU/USD)',
      updatedAt,
      status: 'ok',
    },
  ]

  const fxByRegion = await fetchFxQuotes()
  for (const quote of FX_QUOTES) {
    const fxPoint = fxByRegion.get(quote.region)
    if (!fxPoint) {
      items.push({
        id: `gold-${quote.region}`,
        label: `Gold Spot (${quote.label})`,
        category: 'gold',
        value: null,
        unit: quote.region === 'euro-area' ? 'EUR/oz' : quote.region === 'china' ? 'CNY/oz' : quote.region === 'japan' ? 'JPY/oz' : 'VND/oz',
        source: `Derived from XAU/USD + FRED (${quote.seriesId})`,
        updatedAt,
        status: 'unavailable',
        note: `FX series unavailable for ${quote.label}.`,
      })
      continue
    }

    const currencyPerUsd = toCurrencyPerUsd(fxPoint.value, quote.mode)
    if (!isFiniteNumber(currencyPerUsd) || currencyPerUsd <= 0) {
      items.push({
        id: `gold-${quote.region}`,
        label: `Gold Spot (${quote.label})`,
        category: 'gold',
        value: null,
        unit: quote.region === 'euro-area' ? 'EUR/oz' : quote.region === 'china' ? 'CNY/oz' : quote.region === 'japan' ? 'JPY/oz' : 'VND/oz',
        source: `Derived from XAU/USD + FRED (${quote.seriesId})`,
        updatedAt,
        status: 'unavailable',
        note: `Invalid FX value from ${quote.seriesId}.`,
      })
      continue
    }

    const unit = quote.region === 'euro-area' ? 'EUR/oz' : quote.region === 'china' ? 'CNY/oz' : quote.region === 'japan' ? 'JPY/oz' : 'VND/oz'
    items.push({
      id: `gold-${quote.region}`,
      label: `Gold Spot (${quote.label})`,
      category: 'gold',
      value: safeRound(xauUsd * currencyPerUsd),
      unit,
      source: `Derived from XAU/USD + FRED (${quote.seriesId})`,
      updatedAt: toIsoDate(fxPoint.date) ?? updatedAt,
      status: 'ok',
      note: 'FX-converted benchmark, not local retail jewelry price.',
    })
  }

  return { provider: 'alpha', items }
}

export async function fetchEnergyBenchmarks(): Promise<ProviderResult> {
  const [wtiResult, gasolineResult, fxByRegion] = await Promise.all([
    fetchLatestFredObservation('DCOILWTICO'),
    fetchLatestFredObservation('GASREGW'),
    fetchFxQuotes(),
  ])

  const items: CommodityPoint[] = [
    {
      id: 'energy-intl-wti',
      label: 'Crude Oil (WTI, International)',
      category: 'energy',
      value: safeRound(wtiResult.value),
      unit: 'USD/barrel',
      source: 'FRED (DCOILWTICO)',
      updatedAt: toIsoDate(wtiResult.date),
      status: 'ok',
    },
    {
      id: 'energy-us-gasoline',
      label: 'US Regular Gasoline',
      category: 'energy',
      value: safeRound(gasolineResult.value),
      unit: 'USD/gallon',
      source: 'FRED (GASREGW)',
      updatedAt: toIsoDate(gasolineResult.date),
      status: 'ok',
    },
  ]

  for (const quote of FX_QUOTES) {
    const fxPoint = fxByRegion.get(quote.region)
    const unit =
      quote.region === 'euro-area'
        ? 'EUR/liter'
        : quote.region === 'china'
          ? 'CNY/liter'
          : quote.region === 'japan'
            ? 'JPY/liter'
            : 'VND/liter'

    if (!fxPoint) {
      items.push({
        id: `energy-${quote.region}-wti`,
        label: `Crude Oil Equivalent (${quote.label})`,
        category: 'energy',
        value: null,
        unit,
        source: `Derived from WTI + FRED (${quote.seriesId})`,
        updatedAt: toIsoDate(wtiResult.date),
        status: 'unavailable',
        note: `FX series unavailable for ${quote.label}.`,
      })
      continue
    }

    const currencyPerUsd = toCurrencyPerUsd(fxPoint.value, quote.mode)
    const localPerLiter = (wtiResult.value * currencyPerUsd) / LITERS_PER_BARREL

    items.push({
      id: `energy-${quote.region}-wti`,
      label: `Crude Oil Equivalent (${quote.label})`,
      category: 'energy',
      value: isFiniteNumber(localPerLiter) ? safeRound(localPerLiter) : null,
      unit,
      source: `Derived from WTI + FRED (${quote.seriesId})`,
      updatedAt: toIsoDate(fxPoint.date) ?? toIsoDate(wtiResult.date),
      status: isFiniteNumber(localPerLiter) ? 'ok' : 'unavailable',
      note: 'Crude-equivalent benchmark, excludes tax/refining/retail margins.',
    })
  }

  return { provider: 'fred', items }
}

export async function fetchFoodIndex(): Promise<ProviderResult> {
  const [riceResult, fxByRegion] = await Promise.all([
    fetchLatestFredObservation('PRICENPQUSDM'),
    fetchFxQuotes(),
  ])

  const items: CommodityPoint[] = [
    {
      id: 'food-intl-rice',
      label: 'Rice Price (International, Thailand 5%)',
      category: 'food',
      value: safeRound(riceResult.value),
      unit: 'USD/metric ton',
      source: 'FRED (PRICENPQUSDM)',
      updatedAt: toIsoDate(riceResult.date),
      status: 'ok',
      note: 'Monthly benchmark for export-grade rice.',
    },
  ]

  for (const quote of FX_QUOTES) {
    const fxPoint = fxByRegion.get(quote.region)
    const unit =
      quote.region === 'euro-area'
        ? 'EUR/kg'
        : quote.region === 'china'
          ? 'CNY/kg'
          : quote.region === 'japan'
            ? 'JPY/kg'
            : 'VND/kg'

    if (!fxPoint) {
      items.push({
        id: `food-${quote.region}-rice`,
        label: `Rice Equivalent (${quote.label})`,
        category: 'food',
        value: null,
        unit,
        source: `Derived from rice benchmark + FRED (${quote.seriesId})`,
        updatedAt: toIsoDate(riceResult.date),
        status: 'unavailable',
        note: `FX series unavailable for ${quote.label}.`,
      })
      continue
    }

    const currencyPerUsd = toCurrencyPerUsd(fxPoint.value, quote.mode)
    const localPerKg = (riceResult.value * currencyPerUsd) / KG_PER_METRIC_TON

    items.push({
      id: `food-${quote.region}-rice`,
      label: `Rice Equivalent (${quote.label})`,
      category: 'food',
      value: isFiniteNumber(localPerKg) ? safeRound(localPerKg) : null,
      unit,
      source: `Derived from rice benchmark + FRED (${quote.seriesId})`,
      updatedAt: toIsoDate(fxPoint.date) ?? toIsoDate(riceResult.date),
      status: isFiniteNumber(localPerKg) ? 'ok' : 'unavailable',
      note: 'Import-parity estimate, not local retail shelf price.',
    })
  }

  return { provider: 'fred', items }
}

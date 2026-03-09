import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PriceStatCard from './PriceStatCard'

const meta = {
  title: 'Prices/PriceStatCard',
  component: PriceStatCard,
  args: {
    item: {
      id: 'gold-intl-usd',
      label: 'Gold Spot (International)',
      category: 'gold',
      value: 2910.42,
      unit: 'USD/oz',
      source: 'Alpha Vantage (XAU/USD)',
      updatedAt: '2026-03-05T08:00:00.000Z',
      status: 'ok',
    },
  },
} satisfies Meta<typeof PriceStatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Ok: Story = {}

export const Fallback: Story = {
  args: {
    item: {
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
  },
}

export const Unavailable: Story = {
  args: {
    item: {
      id: 'food-intl-rice',
      label: 'Rice Price (International, Thailand 5%)',
      category: 'food',
      value: null,
      unit: 'USD/metric ton',
      source: 'FRED (PRICENPQUSDM)',
      updatedAt: null,
      status: 'unavailable',
      note: 'Source unavailable: HTTP 500',
    },
  },
}

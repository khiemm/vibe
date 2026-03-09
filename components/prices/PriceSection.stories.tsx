import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PriceSection from './PriceSection'

const meta = {
  title: 'Prices/PriceSection',
  component: PriceSection,
  args: {
    title: 'Energy',
    description: 'WTI crude and US regular gasoline benchmarks.',
    items: [
      {
        id: 'energy-wti',
        label: 'WTI Crude Oil',
        category: 'energy',
        value: 78.34,
        unit: 'USD/barrel',
        source: 'FRED (DCOILWTICO)',
        updatedAt: '2026-03-04T00:00:00.000Z',
        status: 'ok',
      },
      {
        id: 'energy-gasoline',
        label: 'US Regular Gasoline',
        category: 'energy',
        value: null,
        unit: 'USD/gallon',
        source: 'FRED (GASREGW)',
        updatedAt: null,
        status: 'fallback',
        note: 'Live value unavailable.',
      },
    ],
  },
} satisfies Meta<typeof PriceSection>

export default meta
type Story = StoryObj<typeof meta>

export const MixedStates: Story = {}

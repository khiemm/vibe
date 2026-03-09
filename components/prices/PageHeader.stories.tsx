import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PageHeader from './PageHeader'

const meta = {
  title: 'Prices/PageHeader',
  component: PageHeader,
  args: {
    generatedAt: '2026-03-05T09:00:00.000Z',
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

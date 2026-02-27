import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Stat from './Stat'

const meta = {
  title: 'MDX/Stat',
  component: Stat,
  args: {
    label: 'Weekly practice',
    value: '7.5 hours',
    note: 'Up 12% from last week',
  },
} satisfies Meta<typeof Stat>

export default meta
type Story = StoryObj<typeof meta>

export const WithNote: Story = {}

export const WithoutNote: Story = {
  args: {
    note: undefined,
  },
}


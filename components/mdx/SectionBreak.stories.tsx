import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import SectionBreak from './SectionBreak'

const meta = {
  title: 'MDX/SectionBreak',
  component: SectionBreak,
  args: {
    label: 'Next section',
  },
} satisfies Meta<typeof SectionBreak>

export default meta
type Story = StoryObj<typeof meta>

export const ShortLabel: Story = {}

export const LongLabel: Story = {
  args: {
    label: 'Practical examples and review workflow',
  },
}


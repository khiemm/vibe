import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Compare from './Compare'

const meta = {
  title: 'MDX/Compare',
  component: Compare,
  args: {
    leftTitle: 'Before',
    rightTitle: 'After',
    leftItems: ['Memorize random words', 'No review routine'],
    rightItems: ['Learn in context', 'Spaced repetition routine'],
  },
} satisfies Meta<typeof Compare>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const MissingLeft: Story = {
  args: {
    leftItems: undefined,
    left: undefined,
  },
}

export const MissingRight: Story = {
  args: {
    rightItems: undefined,
    right: undefined,
  },
}


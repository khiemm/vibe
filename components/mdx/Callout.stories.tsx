import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Callout from './Callout'

const meta = {
  title: 'MDX/Callout',
  component: Callout,
  args: {
    title: 'Note',
    children: 'Short message to highlight an important detail.',
  },
} satisfies Meta<typeof Callout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutTitle: Story = {
  args: {
    title: undefined,
  },
}

export const LongContent: Story = {
  args: {
    title: 'Detailed note',
    children:
      'Use this block for longer context when a paragraph needs stronger visual emphasis than surrounding body text.',
  },
}

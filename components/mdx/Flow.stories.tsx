import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Flow from './Flow'

const meta = {
  title: 'MDX/Flow',
  component: Flow,
  args: {
    nodes: ['Input', 'Processing', 'Output'],
  },
} satisfies Meta<typeof Flow>

export default meta
type Story = StoryObj<typeof meta>

export const ArrayNodes: Story = {}

export const StringNodes: Story = {
  args: {
    nodes: 'Discover topic || Collect examples || Practice output',
  },
}


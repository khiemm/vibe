import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import QuoteBlock from './QuoteBlock'

const meta = {
  title: 'MDX/QuoteBlock',
  component: QuoteBlock,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'muted', 'accent', 'danger'],
    },
  },
  args: {
    quote: 'Consistency beats intensity for long-term progress.',
    author: 'Learning Journal',
    variant: 'default',
  },
} satisfies Meta<typeof QuoteBlock>

export default meta
type Story = StoryObj<typeof meta>

export const WithAuthor: Story = {
  args: {
    variant: 'default',
  },
}

export const WithoutAuthor: Story = {
  args: {
    author: undefined,
  },
}

export const Accent: Story = {
  args: {
    variant: 'accent',
  },
}

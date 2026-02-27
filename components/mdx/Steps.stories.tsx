import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Steps from './Steps'

const meta = {
  title: 'MDX/Steps',
  component: Steps,
  args: {
    items: [
      { title: 'Choose a target phrase', detail: 'Keep it short and practical.' },
      { title: 'Build your own example', detail: 'Adapt it to your own context.' },
      { title: 'Review after one day', detail: 'Repetition improves recall.' },
    ],
  },
} satisfies Meta<typeof Steps>

export default meta
type Story = StoryObj<typeof meta>

export const ArrayItems: Story = {}

export const StringItems: Story = {
  args: {
    items: 'Read sentence::Understand meaning || Speak sentence::Record your voice',
  },
}


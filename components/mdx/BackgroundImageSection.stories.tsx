import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import BackgroundImageSection from './BackgroundImageSection'

const meta = {
  title: 'MDX/BackgroundImageSection',
  component: BackgroundImageSection,
  args: {
    src: '/images/blog/roadmap-visual.svg',
    alt: 'Decorative background',
    darkness: 'medium',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BackgroundImageSection>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  args: { darkness: 'light' },
}

export const Medium: Story = {
  args: { darkness: 'medium' },
}

export const Strong: Story = {
  args: { darkness: 'strong' },
}

export const NoImage: Story = {
  args: {
    src: '',
  },
}


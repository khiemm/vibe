import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ImageFigure from './ImageFigure'

const meta = {
  title: 'MDX/ImageFigure',
  component: ImageFigure,
  args: {
    src: '/images/blog/roadmap-visual.svg',
    alt: 'Roadmap preview',
    caption: 'Roadmap overview',
    credit: 'Source: Vibe content team',
  },
} satisfies Meta<typeof ImageFigure>

export default meta
type Story = StoryObj<typeof meta>

export const WithCaptionAndCredit: Story = {}

export const Minimal: Story = {
  args: {
    caption: undefined,
    credit: undefined,
  },
}


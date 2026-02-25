import type { MDXComponents } from 'mdx/types'
import Callout from '@/components/mdx/Callout'
import Compare from '@/components/mdx/Compare'
import Flow from '@/components/mdx/Flow'
import ImageFigure from '@/components/mdx/ImageFigure'
import QuoteBlock from '@/components/mdx/QuoteBlock'
import SectionBreak from '@/components/mdx/SectionBreak'
import Stat from '@/components/mdx/Stat'
import Steps from '@/components/mdx/Steps'

const components: MDXComponents = {
  h1: (props) => (
    <h1
      {...props}
      className="mt-8 text-3xl font-light tracking-tight text-gray-100"
    />
  ),
  h2: (props) => (
    <h2
      {...props}
      className="mt-8 text-2xl font-light tracking-tight text-gray-100"
    />
  ),
  p: (props) => (
    <p
      {...props}
      className="mt-4 text-base font-light leading-relaxed text-gray-300"
    />
  ),
  a: (props) => (
    <a
      {...props}
      className="underline decoration-gray-500 underline-offset-4 hover:text-gray-100 transition-colors"
    />
  ),
  ul: (props) => (
    <ul
      {...props}
      className="mt-4 list-disc list-inside space-y-1 text-gray-300"
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      className="mt-4 list-decimal list-inside space-y-1 text-gray-300"
    />
  ),
  li: (props) => <li {...props} className="leading-relaxed" />,
  code: (props) => (
    <code
      {...props}
      className="rounded-sm bg-gray-900/60 px-1.5 py-0.5 text-xs text-gray-200"
    />
  ),
  blockquote: (props) => (
    <blockquote
      {...props}
      className="mt-6 border-l border-gray-700 pl-4 text-gray-400 italic"
    />
  ),
  Callout,
  Steps,
  Compare,
  Flow,
  ImageFigure,
  QuoteBlock,
  Stat,
  SectionBreak,
}

export default components


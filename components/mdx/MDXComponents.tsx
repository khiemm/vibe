import type { MDXComponents } from 'mdx/types'
import BackgroundImageSection from '@/components/mdx/BackgroundImageSection'
import Callout from '@/components/mdx/Callout'
import Compare from '@/components/mdx/Compare'
import Flow from '@/components/mdx/Flow'
import ImageFigure from '@/components/mdx/ImageFigure'
import QuoteBlock from '@/components/mdx/QuoteBlock'
import SectionBreak from '@/components/mdx/SectionBreak'
import Stat from '@/components/mdx/Stat'
import Steps from '@/components/mdx/Steps'
import YouTubeEmbed from '@/components/mdx/YouTubeEmbed'

export default function getMDXComponents(): MDXComponents {
  return {
    h1: (props) => (
      <h1
        {...props}
        className="mt-8 text-3xl font-light tracking-tight text-[color:var(--site-heading)]"
      />
    ),
    h2: (props) => (
      <h2
        {...props}
        className="mt-8 text-2xl font-light tracking-tight text-[color:var(--site-heading)]"
      />
    ),
    p: (props) => (
      <p
        {...props}
        className="mt-4 text-base font-light leading-relaxed text-[color:var(--site-text)]"
      />
    ),
    a: (props) => (
      <a
        {...props}
        className="underline decoration-[color:var(--site-link-decoration)] underline-offset-4 transition-colors hover:text-[color:var(--site-link-hover)]"
      />
    ),
    ul: (props) => (
      <ul
        {...props}
        className="mt-4 list-disc list-inside space-y-1 text-[color:var(--site-text)]"
      />
    ),
    ol: (props) => (
      <ol
        {...props}
        className="mt-4 list-decimal list-inside space-y-1 text-[color:var(--site-text)]"
      />
    ),
    li: (props) => <li {...props} className="leading-relaxed" />,
    code: (props) => (
      <code
        {...props}
        className="rounded-sm bg-[color:var(--site-inline-code-bg)] px-1.5 py-0.5 text-xs text-[color:var(--site-inline-code-text)]"
      />
    ),
    blockquote: (props) => (
      <blockquote
        {...props}
        className="mt-6 border-l border-[color:var(--site-border)] pl-4 italic text-[color:var(--site-muted)]"
      />
    ),
    Callout,
    Steps,
    Compare,
    Flow,
    BackgroundImageSection,
    ImageFigure,
    QuoteBlock,
    Stat,
    SectionBreak,
    YouTubeEmbed,
  }
}


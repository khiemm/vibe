type QuoteBlockProps = {
  quote: string
  author?: string
  variant?: 'default' | 'muted' | 'accent' | 'danger'
}

const VARIANT_CLASSES: Record<NonNullable<QuoteBlockProps['variant']>, { root: string; footer: string }> = {
  default: {
    root: 'border-gray-700 text-gray-300',
    footer: 'text-gray-500',
  },
  muted: {
    root: 'border-gray-800 text-gray-400',
    footer: 'text-gray-600',
  },
  accent: {
    root: 'border-cyan-500 text-cyan-200',
    footer: 'text-cyan-400',
  },
  danger: {
    root: 'border-red-500 text-red-200',
    footer: 'text-red-400',
  },
}

export default function QuoteBlock({ quote, author, variant = 'default' }: QuoteBlockProps) {
  const classes = VARIANT_CLASSES[variant]
  const rootClassName = `mt-8 border-l pl-4 ${classes.root}`

  return (
    <blockquote className={rootClassName}>
      <p className="text-base font-light italic">{quote}</p>
      {author && <footer className={`mt-2 text-xs tracking-wide ${classes.footer}`}>{author}</footer>}
    </blockquote>
  )
}

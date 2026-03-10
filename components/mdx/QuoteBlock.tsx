type QuoteBlockProps = {
  quote: string
  author?: string
  variant?: 'default' | 'muted' | 'accent' | 'danger'
}

const VARIANT_CLASSES: Record<NonNullable<QuoteBlockProps['variant']>, { root: string; footer: string }> = {
  default: {
    root: 'border-[color:var(--site-border)] text-[color:var(--site-text)]',
    footer: 'text-[color:var(--site-muted)]',
  },
  muted: {
    root: 'border-[color:var(--site-border)] text-[color:var(--site-muted)]',
    footer: 'text-[color:var(--site-muted)]',
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

export default function QuoteBlock({
  quote,
  author,
  variant = 'default',
}: QuoteBlockProps) {
  const classes = VARIANT_CLASSES[variant]
  const rootClassName = `mt-8 border-l pl-4 ${classes.root}`

  return (
    <blockquote className={rootClassName}>
      <p className="text-base font-light italic">{quote}</p>
      {author && <footer className={`mt-2 text-xs tracking-wide ${classes.footer}`}>{author}</footer>}
    </blockquote>
  )
}

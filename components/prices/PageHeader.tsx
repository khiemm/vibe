type PageHeaderProps = {
  generatedAt: string
}

function formatGeneratedAt(generatedAt: string): string {
  const date = new Date(generatedAt)
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
}

export default function PageHeader({ generatedAt }: PageHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      <h1 className="text-3xl font-light tracking-tight text-[color:var(--site-heading)]">Daily Commodity Prices</h1>
      <p className="text-sm font-light text-[color:var(--site-text)]">Daily ISR snapshot</p>
      <p className="text-xs font-light text-[color:var(--site-muted)]">Generated at {formatGeneratedAt(generatedAt)} UTC</p>
    </header>
  )
}

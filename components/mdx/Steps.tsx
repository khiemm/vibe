type StepItem = {
  title: string
  detail?: string
}

type StepsProps = {
  items?: StepItem[] | string
}

function normalizeItems(items: StepsProps['items']): StepItem[] {
  if (Array.isArray(items)) return items
  if (typeof items !== 'string') return []

  return items
    .split('||')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, detail] = item.split('::').map((part) => part.trim())
      return { title, detail: detail || undefined }
    })
    .filter((item) => item.title.length > 0)
}

export default function Steps({ items }: StepsProps) {
  const normalizedItems = normalizeItems(items)
  if (!normalizedItems.length) return null

  return (
    <ol className="mt-6 space-y-3">
      {normalizedItems.map((item, index) => (
        <li
          key={`${item.title}-${index}`}
          className="border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-4"
        >
          <p className="text-sm tracking-wide text-[color:var(--site-muted)]">
            {String(index + 1).padStart(2, '0')}
          </p>
          <p className="mt-1 text-base font-light text-[color:var(--site-heading)]">{item.title}</p>
          {item.detail && (
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--site-muted)]">{item.detail}</p>
          )}
        </li>
      ))}
    </ol>
  )
}

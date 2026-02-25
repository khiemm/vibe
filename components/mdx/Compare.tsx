import { ReactNode } from 'react'

type CompareProps = {
  leftTitle: string
  rightTitle: string
  left?: ReactNode
  right?: ReactNode
  leftItems?: string[] | string
  rightItems?: string[] | string
}

function normalizeItems(items: string[] | string | undefined): string[] {
  if (Array.isArray(items)) return items.filter(Boolean)
  if (typeof items !== 'string') return []
  return items
    .split('||')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function Compare({
  leftTitle,
  rightTitle,
  left,
  right,
  leftItems,
  rightItems,
}: CompareProps) {
  const normalizedLeftItems = normalizeItems(leftItems)
  const normalizedRightItems = normalizeItems(rightItems)
  const hasLeftContent = Boolean(left) || normalizedLeftItems.length > 0
  const hasRightContent = Boolean(right) || normalizedRightItems.length > 0

  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="border border-gray-800 bg-gray-900/30 p-4">
        <h3 className="text-xs uppercase tracking-[0.12em] text-gray-400">{leftTitle}</h3>
        {hasLeftContent ? (
          <div className="mt-2 text-sm leading-relaxed text-gray-300">
            {left}
            {normalizedLeftItems.length > 0 && (
              <ul className="space-y-1">
                {normalizedLeftItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      <div className="border border-gray-800 bg-gray-900/30 p-4">
        <h3 className="text-xs uppercase tracking-[0.12em] text-gray-400">{rightTitle}</h3>
        {hasRightContent ? (
          <div className="mt-2 text-sm leading-relaxed text-gray-300">
            {right}
            {normalizedRightItems.length > 0 && (
              <ul className="space-y-1">
                {normalizedRightItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

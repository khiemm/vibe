import { ReactNode } from 'react'

type CalloutProps = {
  title?: string
  children: ReactNode
}

export default function Callout({ title, children }: CalloutProps) {
  return (
    <aside className="mt-6 border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-4">
      {title && (
        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--site-muted)]">
          {title}
        </p>
      )}
      <div className="mt-2 text-sm leading-relaxed text-[color:var(--site-text)]">{children}</div>
    </aside>
  )
}

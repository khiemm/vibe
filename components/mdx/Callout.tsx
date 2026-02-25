import { ReactNode } from 'react'

type CalloutProps = {
  title?: string
  children: ReactNode
}

export default function Callout({ title, children }: CalloutProps) {
  return (
    <aside className="mt-6 border border-gray-700/70 bg-gray-900/40 p-4">
      {title && (
        <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
          {title}
        </p>
      )}
      <div className="mt-2 text-sm leading-relaxed text-gray-300">{children}</div>
    </aside>
  )
}

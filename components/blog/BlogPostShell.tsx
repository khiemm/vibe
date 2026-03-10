'use client'

import type { ReactNode } from 'react'

type BlogPostShellProps = {
  title: string
  date?: string
  children: ReactNode
}

export default function BlogPostShell({
  title,
  date,
  children,
}: BlogPostShellProps) {
  return (
    <main className="relative isolate flex min-h-screen px-4 py-16">
      <div className="relative z-10 mx-auto my-auto w-full max-w-4xl">
        <header className="mb-10 space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-light tracking-tight text-[color:var(--site-heading)]">
              {title}
            </h1>
            {date && (
              <p className="text-xs font-light text-[color:var(--site-muted)]">
                {date}
              </p>
            )}
          </div>
        </header>
        <article className="max-w-none">
          {children}
        </article>
      </div>
    </main>
  )
}

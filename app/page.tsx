'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-3xl text-center space-y-8"
      >
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[color:var(--site-heading)]">
          Hello, I&apos;m here.
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-light leading-8 text-[color:var(--site-muted)]">
          A calm space on the web, now with a server-rendered auth boundary built around encrypted
          HTTP-only cookies and a Cognito-ready backend-for-frontend flow.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-light">
          <Link
            href="/sign-in"
            className="border border-white/15 px-4 py-2 text-[color:var(--site-heading)] transition-colors hover:border-white/30 hover:bg-white/[0.04]"
          >
            Sign in
          </Link>
          <Link
            href="/protected"
            className="border border-white/10 px-4 py-2 text-[color:var(--site-muted)] transition-colors hover:border-white/25 hover:text-[color:var(--site-text)]"
          >
            Open protected page
          </Link>
        </div>
      </motion.div>
    </main>
  )
}

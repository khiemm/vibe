'use client'

import { useTheme } from '@/components/theme/ThemeProvider'

export default function GlobalThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-[60] border border-[color:var(--site-border)] bg-[color:var(--site-surface)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--site-heading)] backdrop-blur transition-colors hover:bg-[color:var(--site-surface-hover)]"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}

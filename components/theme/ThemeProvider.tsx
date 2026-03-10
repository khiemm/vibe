'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'dark' | 'light'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme')
    const nextTheme: Theme =
      storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'

    setThemeState(nextTheme)
    applyTheme(nextTheme)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme)
        applyTheme(nextTheme)
        window.localStorage.setItem('theme', nextTheme)
      },
      toggleTheme: () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark'
        setThemeState(nextTheme)
        applyTheme(nextTheme)
        window.localStorage.setItem('theme', nextTheme)
      },
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import GlobalThemeToggle from '@/components/theme/GlobalThemeToggle'
import ThemeProvider from '@/components/theme/ThemeProvider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Personal Website',
  description: 'A minimal personal website',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[color:var(--site-bg)] text-[color:var(--site-text)] transition-colors`}>
        <ThemeProvider>
          <GlobalThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

import Link from 'next/link'
import { getAuthConfig } from '@/lib/auth/config'
import { getCurrentSession } from '@/lib/auth/server'

export default async function SiteHeader() {
  const authDisabled = getAuthConfig().authMode === 'disabled'
  const session = await getCurrentSession()

  return (
    <header className="border-b border-white/10 px-4 py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm font-light text-[color:var(--site-muted)]">
          <Link href="/" className="text-base tracking-[0.18em] text-[color:var(--site-heading)]">
            VIBE
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog" className="transition-colors hover:text-[color:var(--site-text)]">
              Blog
            </Link>
            <Link href="/prices" className="transition-colors hover:text-[color:var(--site-text)]">
              Prices
            </Link>
            {!authDisabled && (
              <Link href="/protected" className="transition-colors hover:text-[color:var(--site-text)]">
                Protected
              </Link>
            )}
          </nav>
        </div>

        {!authDisabled && (
          <div className="flex items-center gap-3 text-sm font-light text-[color:var(--site-muted)]">
            {session ? (
              <>
                <span className="hidden sm:inline">{session.user.email ?? session.user.username}</span>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="border border-white/15 px-3 py-1.5 text-[color:var(--site-text)] transition-colors hover:border-white/25 hover:text-[color:var(--site-heading)]"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="border border-white/15 px-3 py-1.5 text-[color:var(--site-text)] transition-colors hover:border-white/25 hover:text-[color:var(--site-heading)]"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

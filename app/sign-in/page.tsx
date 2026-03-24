import { redirect } from 'next/navigation'
import { getAuthConfig } from '@/lib/auth/config'
import { getCurrentSession, needsSessionRefresh, normalizeReturnTo } from '@/lib/auth/server'

type SignInPageProps = {
  searchParams?: {
    error?: string
    reason?: string
    returnTo?: string
  }
}

function getMessage(error?: string, reason?: string) {
  if (error === 'invalid_credentials') {
    return 'The email or password was not accepted.'
  }

  if (reason === 'expired') {
    return 'Your session expired, so please sign in again.'
  }

  if (reason === 'missing') {
    return 'Sign in is required before opening that page.'
  }

  if (reason === 'disabled' || error === 'auth_disabled') {
    return 'Authentication is temporarily unavailable.'
  }

  if (error === 'invalid_origin') {
    return 'The auth request was blocked because it did not come from this site.'
  }

  if (error) {
    return 'The sign-in flow could not be completed.'
  }

  return null
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const returnTo = normalizeReturnTo(searchParams?.returnTo)
  const authDisabled = getAuthConfig().authMode === 'disabled'
  const session = await getCurrentSession()

  if (session && !authDisabled) {
    if (needsSessionRefresh(session)) {
      redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`)
    }

    redirect(returnTo)
  }

  const message =
    getMessage(searchParams?.error, searchParams?.reason) ??
    (authDisabled ? 'Authentication is temporarily unavailable.' : null)

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md space-y-8 border border-white/10 bg-white/[0.02] p-8 backdrop-blur">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
            Secure Area
          </p>
          <h1 className="text-3xl font-light tracking-tight text-[color:var(--site-heading)]">
            Sign in
          </h1>
          <p className="text-sm font-light leading-7 text-[color:var(--site-muted)]">
            Authentication stays on the server. This app sets an encrypted HTTP-only session
            cookie and never uses localStorage for auth state.
          </p>
        </div>

        {message && (
          <p className="border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100">
            {message}
          </p>
        )}

        {authDisabled ? (
          <p className="text-sm font-light leading-7 text-[color:var(--site-muted)]">
            The sign-in form is hidden while authentication is disabled for this deployment.
          </p>
        ) : (
          <form action="/api/auth/login" method="post" className="space-y-5">
            <input type="hidden" name="returnTo" value={returnTo} />

            <label className="block space-y-2">
              <span className="text-sm font-light text-[color:var(--site-muted)]">Email</span>
              <input
                type="email"
                name="username"
                autoComplete="username"
                className="w-full border border-white/10 bg-transparent px-3 py-2.5 text-sm text-[color:var(--site-text)] outline-none transition-colors focus:border-white/30"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-light text-[color:var(--site-muted)]">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full border border-white/10 bg-transparent px-3 py-2.5 text-sm text-[color:var(--site-text)] outline-none transition-colors focus:border-white/30"
                required
              />
            </label>

            <button
              type="submit"
              className="w-full border border-white/20 px-4 py-3 text-sm text-[color:var(--site-heading)] transition-colors hover:border-white/35 hover:bg-white/[0.04]"
            >
              Continue
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

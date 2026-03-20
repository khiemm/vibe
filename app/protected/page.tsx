import { requirePageSession } from '@/lib/auth/server'

function formatDate(value: number) {
  return new Date(value * 1000).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default async function ProtectedPage() {
  const session = await requirePageSession('/protected')

  return (
    <main className="min-h-[calc(100vh-73px)] px-4 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
            Protected
          </p>
          <h1 className="text-4xl font-light tracking-tight text-[color:var(--site-heading)]">
            Server-rendered session
          </h1>
          <p className="max-w-2xl text-sm font-light leading-7 text-[color:var(--site-muted)]">
            This page only renders after the server validates the encrypted session cookie. If the
            access token is close to expiring, the request is redirected through the refresh route
            before the page renders.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="space-y-2 border border-white/10 bg-white/[0.02] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
              Identity
            </p>
            <h2 className="text-2xl font-light text-[color:var(--site-heading)]">
              {session.user.name ?? session.user.email ?? session.user.username}
            </h2>
            <p className="text-sm text-[color:var(--site-muted)]">{session.user.sub}</p>
          </article>

          <article className="space-y-2 border border-white/10 bg-white/[0.02] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
              Session Window
            </p>
            <p className="text-sm text-[color:var(--site-text)]">
              Access token refresh check: {formatDate(session.accessTokenExpiresAt)}
            </p>
            <p className="text-sm text-[color:var(--site-text)]">
              Session cookie expires: {formatDate(session.refreshTokenExpiresAt)}
            </p>
          </article>
        </div>

        <article className="space-y-4 border border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
            Claims
          </p>
          <dl className="grid gap-4 text-sm font-light text-[color:var(--site-text)] md:grid-cols-2">
            <div>
              <dt className="text-[color:var(--site-muted)]">Username</dt>
              <dd>{session.user.username}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--site-muted)]">Email</dt>
              <dd>{session.user.email ?? 'Not available'}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--site-muted)]">Groups</dt>
              <dd>{session.user.groups.length > 0 ? session.user.groups.join(', ') : 'reader'}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--site-muted)]">Session ID</dt>
              <dd>{session.sid}</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  )
}

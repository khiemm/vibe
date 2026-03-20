import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import type { AuthServiceSuccess } from '@/lib/auth/contracts'
import { getAuthConfig } from '@/lib/auth/config'
import { decryptSessionCookie, type SessionCookiePayload } from '@/lib/auth/session-cookie'
import { verifyAuthServiceTokens } from '@/lib/auth/token-verifier'

function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}

export function normalizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/protected'
  }

  return value
}

export async function buildSessionCookiePayload(result: AuthServiceSuccess): Promise<SessionCookiePayload> {
  const verified = await verifyAuthServiceTokens(result)

  return {
    sid: verified.sid,
    user: verified.user,
    accessTokenExpiresAt: verified.accessTokenExpiresAt,
    refreshTokenExpiresAt: verified.refreshTokenExpiresAt,
  }
}

export async function getCurrentSession() {
  const config = getAuthConfig()
  const rawCookie = cookies().get(config.cookieName)?.value

  if (!rawCookie) return null

  return decryptSessionCookie(rawCookie)
}

export async function getSessionFromRequest(request: NextRequest) {
  const config = getAuthConfig()
  const rawCookie = request.cookies.get(config.cookieName)?.value

  if (!rawCookie) return null

  return decryptSessionCookie(rawCookie)
}

export function needsSessionRefresh(session: SessionCookiePayload) {
  return session.accessTokenExpiresAt <= nowInSeconds() + getAuthConfig().sessionRefreshWindowSeconds
}

export async function requirePageSession(returnTo: string) {
  const session = await getCurrentSession()

  if (!session) {
    redirect(`/sign-in?reason=missing&returnTo=${encodeURIComponent(returnTo)}`)
  }

  if (needsSessionRefresh(session)) {
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return session
}

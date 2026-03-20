import { NextRequest, NextResponse } from 'next/server'
import { getAuthProvider } from '@/lib/auth/provider'
import { getSessionFromRequest, needsSessionRefresh } from '@/lib/auth/server'
import { buildSessionCookiePayload } from '@/lib/auth/server'
import { clearSessionCookie, writeSessionCookie } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let activeSession = session

  if (needsSessionRefresh(session)) {
    try {
      const result = await getAuthProvider().refresh({ sessionId: session.sid })
      activeSession = await buildSessionCookiePayload(result)
    } catch {
      const expiredResponse = NextResponse.json({ error: 'session_expired' }, { status: 401 })
      clearSessionCookie(expiredResponse)
      return expiredResponse
    }
  }

  const response = NextResponse.json({
    user: activeSession.user,
    accessTokenExpiresAt: activeSession.accessTokenExpiresAt,
    refreshTokenExpiresAt: activeSession.refreshTokenExpiresAt,
  })

  if (activeSession !== session) {
    await writeSessionCookie(response, activeSession)
  }

  return response
}

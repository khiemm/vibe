import { NextRequest, NextResponse } from 'next/server'
import { isAuthDisabled } from '@/lib/auth/config'
import { getAuthProvider } from '@/lib/auth/provider'
import { getSessionFromRequest, normalizeReturnTo } from '@/lib/auth/server'
import { clearSessionCookie, writeSessionCookie } from '@/lib/auth/session-cookie'
import { buildSessionCookiePayload } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

function toSignInUrl(request: NextRequest, returnTo: string, reason = 'expired') {
  const url = new URL('/sign-in', request.url)
  url.searchParams.set('returnTo', returnTo)
  url.searchParams.set('reason', reason)
  return url
}

export async function GET(request: NextRequest) {
  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get('returnTo'))

  if (isAuthDisabled()) {
    const response = NextResponse.redirect(toSignInUrl(request, returnTo, 'disabled'))
    clearSessionCookie(response)
    return response
  }

  const session = await getSessionFromRequest(request)

  if (!session) {
    const response = NextResponse.redirect(toSignInUrl(request, returnTo))
    clearSessionCookie(response)
    return response
  }

  try {
    const result = await getAuthProvider().refresh({ sessionId: session.sid })
    const payload = await buildSessionCookiePayload(result)
    const response = NextResponse.redirect(new URL(returnTo, request.url))

    await writeSessionCookie(response, payload)

    return response
  } catch {
    const response = NextResponse.redirect(toSignInUrl(request, returnTo))
    clearSessionCookie(response)
    return response
  }
}

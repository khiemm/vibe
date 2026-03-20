import { NextRequest, NextResponse } from 'next/server'
import { assertSameOrigin } from '@/lib/auth/origin'
import { getAuthProvider } from '@/lib/auth/provider'
import { getSessionFromRequest, normalizeReturnTo } from '@/lib/auth/server'
import { clearSessionCookie } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'
const SEE_OTHER_STATUS = 303

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const returnTo = normalizeReturnTo(String(formData.get('returnTo') ?? '/'))

  try {
    assertSameOrigin(request)

    const session = await getSessionFromRequest(request)

    if (session) {
      await getAuthProvider().signOut({ sessionId: session.sid })
    }
  } catch {
    // The local cookie should still be cleared even if the upstream sign-out fails.
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url), SEE_OTHER_STATUS)
  clearSessionCookie(response)

  return response
}

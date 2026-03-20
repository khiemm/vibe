import { NextRequest, NextResponse } from 'next/server'
import { AuthError } from '@/lib/auth/errors'
import { assertSameOrigin } from '@/lib/auth/origin'
import { getAuthProvider } from '@/lib/auth/provider'
import { buildSessionCookiePayload, normalizeReturnTo } from '@/lib/auth/server'
import { clearSessionCookie, writeSessionCookie } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'
const SEE_OTHER_STATUS = 303

function toRedirectUrl(request: NextRequest, returnTo: string, error?: string) {
  const url = new URL('/sign-in', request.url)
  url.searchParams.set('returnTo', returnTo)

  if (error) {
    url.searchParams.set('error', error)
  }

  return url
}

function getIpAddress(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const returnTo = normalizeReturnTo(String(formData.get('returnTo') ?? '/protected'))

  try {
    assertSameOrigin(request)

    if (!username || !password) {
      throw new AuthError(400, 'missing_credentials', 'Username and password are required')
    }

    const result = await getAuthProvider().signIn({
      username,
      password,
      userAgent: request.headers.get('user-agent'),
      ipAddress: getIpAddress(request),
    })
    const payload = await buildSessionCookiePayload(result)
    const response = NextResponse.redirect(new URL(returnTo, request.url), SEE_OTHER_STATUS)

    await writeSessionCookie(response, payload)

    return response
  } catch (error) {
    const authError =
      error instanceof AuthError
        ? error
        : new AuthError(500, 'unexpected_sign_in_error', 'The sign-in flow failed unexpectedly')
    const response = NextResponse.redirect(
      toRedirectUrl(request, returnTo, authError.code === 'missing_credentials' ? 'invalid_credentials' : authError.code),
      SEE_OTHER_STATUS,
    )

    clearSessionCookie(response)

    return response
  }
}

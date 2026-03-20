import { NextRequest } from 'next/server'
import { getAuthConfig } from '@/lib/auth/config'
import { AuthError } from '@/lib/auth/errors'

export function assertSameOrigin(request: NextRequest) {
  const expectedOrigin = new URL(getAuthConfig().appBaseUrl).origin
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin && origin === expectedOrigin) {
    return
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin

      if (refererOrigin === expectedOrigin) {
        return
      }
    } catch {
      throw new AuthError(403, 'invalid_origin', 'Cross-site auth requests are not allowed')
    }
  }

  throw new AuthError(403, 'invalid_origin', 'Cross-site auth requests are not allowed')
}

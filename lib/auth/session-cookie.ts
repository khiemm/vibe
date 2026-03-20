import { createHash } from 'node:crypto'
import { EncryptJWT, errors, jwtDecrypt, type JWTPayload } from 'jose'
import { getAuthConfig } from '@/lib/auth/config'

export type SessionUser = {
  sub: string
  username: string
  email?: string
  name?: string
  groups: string[]
}

export type SessionCookiePayload = JWTPayload & {
  sid: string
  user: SessionUser
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

type CookieWriter = {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void
  }
}

function getSecretKey() {
  return createHash('sha256').update(getAuthConfig().sessionSecret).digest()
}

function getCookieMaxAge(payload: SessionCookiePayload) {
  const now = Math.floor(Date.now() / 1000)
  return Math.max(payload.refreshTokenExpiresAt - now, 0)
}

export async function encryptSessionCookie(payload: SessionCookiePayload) {
  return new EncryptJWT({
    sid: payload.sid,
    user: payload.user,
    accessTokenExpiresAt: payload.accessTokenExpiresAt,
    refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(payload.refreshTokenExpiresAt)
    .encrypt(getSecretKey())
}

export async function decryptSessionCookie(rawValue: string): Promise<SessionCookiePayload | null> {
  try {
    const { payload } = await jwtDecrypt(rawValue, getSecretKey(), {
      clockTolerance: 5,
    })

    if (
      typeof payload.sid !== 'string' ||
      !payload.user ||
      typeof payload.user !== 'object' ||
      typeof payload.accessTokenExpiresAt !== 'number' ||
      typeof payload.refreshTokenExpiresAt !== 'number'
    ) {
      return null
    }

    const user = payload.user as SessionUser

    if (
      typeof user.sub !== 'string' ||
      typeof user.username !== 'string' ||
      !Array.isArray(user.groups)
    ) {
      return null
    }

    return {
      sid: payload.sid,
      user,
      accessTokenExpiresAt: payload.accessTokenExpiresAt,
      refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
      exp: payload.exp,
      iat: payload.iat,
    }
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return null
    }

    throw error
  }
}

export async function writeSessionCookie(response: CookieWriter, payload: SessionCookiePayload) {
  const config = getAuthConfig()
  const encrypted = await encryptSessionCookie(payload)

  response.cookies.set(config.cookieName, encrypted, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    maxAge: getCookieMaxAge(payload),
  })
}

export function clearSessionCookie(response: CookieWriter) {
  const config = getAuthConfig()

  response.cookies.set(config.cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    maxAge: 0,
  })
}

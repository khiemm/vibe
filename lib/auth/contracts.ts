export type AuthMode = 'mock' | 'remote'

export type SignInRequest = {
  username: string
  password: string
  userAgent?: string | null
  ipAddress?: string | null
}

export type RefreshSessionRequest = {
  sessionId: string
}

export type SignOutRequest = {
  sessionId: string
}

export type AuthServiceSuccess = {
  sessionId: string
  accessToken: string
  idToken: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

export type AuthServiceErrorShape = {
  error: {
    code: string
    message: string
  }
}

export function isAuthServiceSuccess(value: unknown): value is AuthServiceSuccess {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<AuthServiceSuccess>

  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.accessToken === 'string' &&
    typeof candidate.idToken === 'string' &&
    typeof candidate.accessTokenExpiresAt === 'number' &&
    typeof candidate.refreshTokenExpiresAt === 'number'
  )
}

export function isAuthServiceErrorShape(value: unknown): value is AuthServiceErrorShape {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<AuthServiceErrorShape>

  return (
    !!candidate.error &&
    typeof candidate.error === 'object' &&
    typeof candidate.error.code === 'string' &&
    typeof candidate.error.message === 'string'
  )
}

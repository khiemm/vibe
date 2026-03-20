import { beforeEach, describe, expect, it } from 'vitest'
import { resetAuthConfigForTests } from '@/lib/auth/config'
import { AuthError } from '@/lib/auth/errors'
import {
  refreshMockSession,
  resetMockAuthState,
  signInWithMockAuth,
  signOutWithMockAuth,
} from '@/lib/auth/mock-auth-service'
import { verifyAuthServiceTokens } from '@/lib/auth/token-verifier'

function applyMockEnv() {
  process.env.AUTH_MODE = 'mock'
  process.env.APP_BASE_URL = 'http://localhost:3434'
  process.env.AUTH_SESSION_SECRET = 'test-session-secret-which-is-long-enough'
  process.env.MOCK_AUTH_JWT_SECRET = 'test-jwt-secret-which-is-also-long-enough'
  process.env.MOCK_AUTH_USERNAME = 'demo@example.com'
  process.env.MOCK_AUTH_PASSWORD = 'ChangeMe123!'
  process.env.MOCK_AUTH_EMAIL = 'demo@example.com'
  process.env.MOCK_AUTH_DISPLAY_NAME = 'Demo User'
  process.env.MOCK_AUTH_ACCESS_TOKEN_TTL_SECONDS = '300'
  process.env.MOCK_AUTH_REFRESH_TOKEN_TTL_SECONDS = '3600'
}

beforeEach(() => {
  applyMockEnv()
  resetAuthConfigForTests()
  resetMockAuthState()
})

describe('mock auth service', () => {
  it('signs in and returns verifiable tokens', async () => {
    const result = await signInWithMockAuth({
      username: 'demo@example.com',
      password: 'ChangeMe123!',
    })

    const verified = await verifyAuthServiceTokens(result)

    expect(verified.sid).toBe(result.sessionId)
    expect(verified.user.email).toBe('demo@example.com')
    expect(verified.user.groups).toEqual(['reader'])
  })

  it('refreshes and invalidates a session after sign out', async () => {
    const result = await signInWithMockAuth({
      username: 'demo@example.com',
      password: 'ChangeMe123!',
    })

    const refreshed = await refreshMockSession({ sessionId: result.sessionId })
    expect(refreshed.sessionId).toBe(result.sessionId)

    await signOutWithMockAuth({ sessionId: result.sessionId })

    await expect(refreshMockSession({ sessionId: result.sessionId })).rejects.toMatchObject({
      status: 401,
      code: 'session_not_found',
    } satisfies Partial<AuthError>)
  })

  it('rejects invalid credentials', async () => {
    await expect(
      signInWithMockAuth({
        username: 'demo@example.com',
        password: 'bad-password',
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'invalid_credentials',
    } satisfies Partial<AuthError>)
  })
})

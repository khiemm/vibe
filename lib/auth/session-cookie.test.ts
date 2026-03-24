import { beforeEach, describe, expect, it } from 'vitest'
import { resetAuthConfigForTests } from '@/lib/auth/config'
import { decryptSessionCookie, encryptSessionCookie } from '@/lib/auth/session-cookie'

function applyAuthEnv() {
  process.env.AUTH_MODE = 'remote'
  process.env.APP_BASE_URL = 'http://localhost:3434'
  process.env.AUTH_SESSION_SECRET = 'test-session-secret-which-is-long-enough'
  process.env.AUTH_API_BASE_URL = 'https://auth.example.com'
  process.env.AUTH_API_SERVICE_TOKEN = 'service-token'
  process.env.COGNITO_AWS_REGION = 'ap-southeast-1'
  process.env.COGNITO_USER_POOL_ID = 'ap-southeast-1_example'
  process.env.COGNITO_USER_POOL_CLIENT_ID = 'exampleclientid'
}

beforeEach(() => {
  applyAuthEnv()
  resetAuthConfigForTests()
})

describe('session cookies', () => {
  it('encrypts and decrypts the session payload', async () => {
    const cookie = await encryptSessionCookie({
      sid: 'session-123',
      user: {
        sub: 'user-123',
        username: 'demo@example.com',
        email: 'demo@example.com',
        name: 'Demo User',
        groups: ['reader'],
      },
      accessTokenExpiresAt: 1_900_000_000,
      refreshTokenExpiresAt: 1_900_000_900,
    })

    const decrypted = await decryptSessionCookie(cookie)

    expect(decrypted).not.toBeNull()
    expect(decrypted?.sid).toBe('session-123')
    expect(decrypted?.user.email).toBe('demo@example.com')
    expect(decrypted?.accessTokenExpiresAt).toBe(1_900_000_000)
  })
})

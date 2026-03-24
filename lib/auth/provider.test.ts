import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthProvider } from '@/lib/auth/provider'
import { resetAuthConfigForTests } from '@/lib/auth/config'
import { AuthError } from '@/lib/auth/errors'

function applyRemoteEnv() {
  process.env.APP_BASE_URL = 'http://localhost:3434'
  process.env.AUTH_SESSION_SECRET = 'test-session-secret-which-is-long-enough'
  process.env.AUTH_API_BASE_URL = 'https://auth.example.com'
  process.env.AUTH_API_SERVICE_TOKEN = 'service-token'
  process.env.COGNITO_AWS_REGION = 'ap-southeast-1'
  process.env.COGNITO_USER_POOL_ID = 'ap-southeast-1_example'
  process.env.COGNITO_USER_POOL_CLIENT_ID = 'exampleclientid'
  process.env.COGNITO_ISSUER = 'https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_example'
  process.env.COGNITO_JWKS_URI =
    'https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_example/.well-known/jwks.json'
}

function buildAuthServiceSuccess() {
  return {
    sessionId: 'session-123',
    accessToken: 'access-token',
    idToken: 'id-token',
    accessTokenExpiresAt: 1_900_000_000,
    refreshTokenExpiresAt: 1_900_000_900,
  }
}

let fetchMock: ReturnType<typeof vi.fn>

function setAuthMode(mode: 'remote' | 'disabled') {
  process.env.AUTH_MODE = mode
}

beforeEach(() => {
  applyRemoteEnv()
  setAuthMode('remote')
  resetAuthConfigForTests()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  resetAuthConfigForTests()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('auth provider', () => {
  it('posts credentials to the remote auth API and returns the login payload', async () => {
    const payload = buildAuthServiceSuccess()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await getAuthProvider().signIn({
      username: 'demo@example.com',
      password: 'ChangeMe123!',
      userAgent: 'vitest',
      ipAddress: '127.0.0.1',
    })

    expect(result).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toBe('https://auth.example.com/auth/login')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({
      'content-type': 'application/json',
      'x-auth-service-token': 'service-token',
    })
    expect(JSON.parse(String(init.body))).toEqual({
      username: 'demo@example.com',
      password: 'ChangeMe123!',
      userAgent: 'vitest',
      ipAddress: '127.0.0.1',
    })
  })

  it('surfaces upstream auth errors from the remote API', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'invalid_credentials',
            message: 'The email or password was not accepted.',
          },
        }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

    await expect(
      getAuthProvider().signIn({
        username: 'demo@example.com',
        password: 'bad-password',
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'invalid_credentials',
    } satisfies Partial<AuthError>)
  })

  it('rejects malformed refresh payloads from the remote API', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sessionId: 'session-123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(
      getAuthProvider().refresh({
        sessionId: 'session-123',
      }),
    ).rejects.toMatchObject({
      status: 502,
      code: 'invalid_auth_response',
    } satisfies Partial<AuthError>)
  })

  it('posts logout requests to the remote auth API', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(
      getAuthProvider().signOut({
        sessionId: 'session-123',
      }),
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toBe('https://auth.example.com/auth/logout')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({
      sessionId: 'session-123',
    })
  })

  it('rejects login requests when auth mode is disabled', async () => {
    setAuthMode('disabled')
    resetAuthConfigForTests()

    await expect(
      getAuthProvider().signIn({
        username: 'demo@example.com',
        password: 'ChangeMe123!',
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: 'auth_disabled',
    } satisfies Partial<AuthError>)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

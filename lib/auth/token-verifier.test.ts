import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { resetAuthConfigForTests } from '@/lib/auth/config'
import { resetTokenVerifierForTests, verifyAuthServiceTokens } from '@/lib/auth/token-verifier'

function applyRemoteEnv() {
  process.env.AUTH_MODE = 'remote'
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

function getRequestUrl(input: string | URL | Request) {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

async function createRemoteTokenPair(overrides?: {
  accessTokenUse?: string
  accessClientId?: string
}) {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  const issuer = process.env.COGNITO_ISSUER!
  const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID!

  jwk.alg = 'RS256'
  jwk.kid = 'test-key'
  jwk.use = 'sig'

  const accessToken = await new SignJWT({
    token_use: overrides?.accessTokenUse ?? 'access',
    username: 'demo@example.com',
    client_id: overrides?.accessClientId ?? clientId,
    scope: 'openid profile email',
    'cognito:groups': ['reader'],
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })
    .setIssuer(issuer)
    .setSubject('user-123')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)

  const idToken = await new SignJWT({
    token_use: 'id',
    email: 'demo@example.com',
    name: 'Demo User',
    'cognito:username': 'demo@example.com',
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })
    .setIssuer(issuer)
    .setSubject('user-123')
    .setAudience(clientId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)

  return {
    accessToken,
    idToken,
    jwk,
  }
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  applyRemoteEnv()
  resetAuthConfigForTests()
  resetTokenVerifierForTests()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  resetAuthConfigForTests()
  resetTokenVerifierForTests()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('verifyAuthServiceTokens', () => {
  it('verifies Cognito-style JWTs against the configured JWKS endpoint', async () => {
    const tokens = await createRemoteTokenPair()
    const jwksUri = process.env.COGNITO_JWKS_URI!

    fetchMock.mockImplementation(async (input: string | URL | Request) => {
      const url = getRequestUrl(input)

      if (url !== jwksUri) {
        return new Response('not found', { status: 404 })
      }

      return new Response(JSON.stringify({ keys: [tokens.jwk] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const verified = await verifyAuthServiceTokens({
      sessionId: 'session-123',
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      accessTokenExpiresAt: 1_900_000_000,
      refreshTokenExpiresAt: 1_900_000_900,
    })

    expect(verified).toEqual({
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
    expect(fetchMock).toHaveBeenCalled()
  })

  it('rejects access tokens that do not belong to the configured app client', async () => {
    const tokens = await createRemoteTokenPair({
      accessClientId: 'another-client-id',
    })
    const jwksUri = process.env.COGNITO_JWKS_URI!

    fetchMock.mockImplementation(async (input: string | URL | Request) => {
      const url = getRequestUrl(input)

      if (url !== jwksUri) {
        return new Response('not found', { status: 404 })
      }

      return new Response(JSON.stringify({ keys: [tokens.jwk] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    await expect(
      verifyAuthServiceTokens({
        sessionId: 'session-123',
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        accessTokenExpiresAt: 1_900_000_000,
        refreshTokenExpiresAt: 1_900_000_900,
      }),
    ).rejects.toThrow('Expected an access token from Cognito')
  })
})

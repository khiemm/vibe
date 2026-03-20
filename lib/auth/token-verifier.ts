import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTPayload } from 'jose'
import type { AuthServiceSuccess } from '@/lib/auth/contracts'
import { getAuthConfig } from '@/lib/auth/config'

export type VerifiedAuthSession = {
  sid: string
  user: {
    sub: string
    username: string
    email?: string
    name?: string
    groups: string[]
  }
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getRemoteJwks() {
  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(getAuthConfig().remote.jwksUri))
  }

  return remoteJwks
}

function getMockSecret() {
  return new TextEncoder().encode(getAuthConfig().mock.jwtSecret)
}

function readStringClaim(payload: JWTPayload, key: string) {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function readGroups(payload: JWTPayload) {
  const value = payload['cognito:groups']
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

async function verifyMockIdToken(token: string) {
  const config = getAuthConfig()
  const { payload } = await jwtVerify(token, getMockSecret(), {
    issuer: config.mock.issuer,
    audience: config.mock.clientId,
  })

  if (payload.token_use !== 'id') {
    throw new Error('Expected an ID token from the mock auth provider')
  }

  return payload
}

async function verifyMockAccessToken(token: string) {
  const config = getAuthConfig()
  const { payload } = await jwtVerify(token, getMockSecret(), {
    issuer: config.mock.issuer,
  })

  if (payload.token_use !== 'access' || payload.client_id !== config.mock.clientId) {
    throw new Error('Expected an access token from the mock auth provider')
  }

  return payload
}

async function verifyRemoteIdToken(token: string) {
  const config = getAuthConfig()
  const { payload } = await jwtVerify(token, getRemoteJwks(), {
    issuer: config.remote.issuer,
    audience: config.remote.clientId,
  })

  if (payload.token_use !== 'id') {
    throw new Error('Expected an ID token from Cognito')
  }

  return payload
}

async function verifyRemoteAccessToken(token: string) {
  const config = getAuthConfig()
  const { payload } = await jwtVerify(token, getRemoteJwks(), {
    issuer: config.remote.issuer,
  })

  if (payload.token_use !== 'access' || payload.client_id !== config.remote.clientId) {
    throw new Error('Expected an access token from Cognito')
  }

  return payload
}

export async function verifyAuthServiceTokens(result: AuthServiceSuccess): Promise<VerifiedAuthSession> {
  const config = getAuthConfig()
  const idPayload =
    config.authMode === 'mock'
      ? await verifyMockIdToken(result.idToken)
      : await verifyRemoteIdToken(result.idToken)
  const accessPayload =
    config.authMode === 'mock'
      ? await verifyMockAccessToken(result.accessToken)
      : await verifyRemoteAccessToken(result.accessToken)

  const sub = readStringClaim(idPayload, 'sub')
  const username =
    readStringClaim(idPayload, 'cognito:username') ??
    readStringClaim(idPayload, 'username') ??
    readStringClaim(accessPayload, 'username')

  if (!sub || !username) {
    throw new Error('Auth tokens are missing the required subject claims')
  }

  return {
    sid: result.sessionId,
    user: {
      sub,
      username,
      email: readStringClaim(idPayload, 'email'),
      name: readStringClaim(idPayload, 'name'),
      groups: readGroups(accessPayload),
    },
    accessTokenExpiresAt: result.accessTokenExpiresAt,
    refreshTokenExpiresAt: result.refreshTokenExpiresAt,
  }
}

export async function createMockTokenPair(input: {
  sub: string
  username: string
  email: string
  name: string
  groups: string[]
  accessTokenExpiresAt: number
}) {
  const config = getAuthConfig()
  const secret = getMockSecret()

  const accessToken = await new SignJWT({
    token_use: 'access',
    username: input.username,
    client_id: config.mock.clientId,
    scope: 'openid profile email',
    'cognito:groups': input.groups,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(config.mock.issuer)
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime(input.accessTokenExpiresAt)
    .sign(secret)

  const idToken = await new SignJWT({
    token_use: 'id',
    email: input.email,
    name: input.name,
    'cognito:username': input.username,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(config.mock.issuer)
    .setSubject(input.sub)
    .setAudience(config.mock.clientId)
    .setIssuedAt()
    .setExpirationTime(input.accessTokenExpiresAt)
    .sign(secret)

  return { accessToken, idToken }
}

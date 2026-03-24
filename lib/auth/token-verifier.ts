import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
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

function readStringClaim(payload: JWTPayload, key: string) {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function readGroups(payload: JWTPayload) {
  const value = payload['cognito:groups']
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
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
  const idPayload = await verifyRemoteIdToken(result.idToken)
  const accessPayload = await verifyRemoteAccessToken(result.accessToken)

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

export function resetTokenVerifierForTests() {
  remoteJwks = null
}

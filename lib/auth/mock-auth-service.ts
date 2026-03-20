import { randomUUID } from 'node:crypto'
import type {
  AuthServiceSuccess,
  RefreshSessionRequest,
  SignInRequest,
  SignOutRequest,
} from '@/lib/auth/contracts'
import { getAuthConfig } from '@/lib/auth/config'
import { AuthError } from '@/lib/auth/errors'
import { createMockTokenPair } from '@/lib/auth/token-verifier'

type MockSessionRecord = {
  sessionId: string
  sub: string
  username: string
  email: string
  name: string
  groups: string[]
  refreshTokenExpiresAt: number
}

const mockSessions = new Map<string, MockSessionRecord>()

function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}

async function issueTokens(session: MockSessionRecord): Promise<AuthServiceSuccess> {
  const config = getAuthConfig()
  const accessTokenExpiresAt = nowInSeconds() + config.mock.accessTokenTtlSeconds
  const tokens = await createMockTokenPair({
    sub: session.sub,
    username: session.username,
    email: session.email,
    name: session.name,
    groups: session.groups,
    accessTokenExpiresAt,
  })

  return {
    sessionId: session.sessionId,
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt,
  }
}

export async function signInWithMockAuth(input: SignInRequest) {
  const config = getAuthConfig()

  if (input.username !== config.mock.username || input.password !== config.mock.password) {
    throw new AuthError(401, 'invalid_credentials', 'The provided credentials are not valid')
  }

  const sessionId = randomUUID()
  const refreshTokenExpiresAt = nowInSeconds() + config.mock.refreshTokenTtlSeconds
  const session: MockSessionRecord = {
    sessionId,
    sub: `mock-user-${config.mock.username}`,
    username: config.mock.username,
    email: config.mock.email,
    name: config.mock.displayName,
    groups: ['reader'],
    refreshTokenExpiresAt,
  }

  mockSessions.set(sessionId, session)

  return issueTokens(session)
}

export async function refreshMockSession(input: RefreshSessionRequest) {
  const session = mockSessions.get(input.sessionId)

  if (!session) {
    throw new AuthError(401, 'session_not_found', 'The session does not exist')
  }

  if (session.refreshTokenExpiresAt <= nowInSeconds()) {
    mockSessions.delete(input.sessionId)
    throw new AuthError(401, 'session_expired', 'The session has expired')
  }

  return issueTokens(session)
}

export async function signOutWithMockAuth(input: SignOutRequest) {
  mockSessions.delete(input.sessionId)
}

export function resetMockAuthState() {
  mockSessions.clear()
}

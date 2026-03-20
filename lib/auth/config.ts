import type { AuthMode } from '@/lib/auth/contracts'

type BaseConfig = {
  appBaseUrl: string
  authMode: AuthMode
  cookieName: string
  secureCookies: boolean
  sessionSecret: string
  sessionRefreshWindowSeconds: number
}

type MockConfig = {
  accessTokenTtlSeconds: number
  refreshTokenTtlSeconds: number
  username: string
  password: string
  email: string
  displayName: string
  issuer: string
  clientId: string
  jwtSecret: string
}

type RemoteConfig = {
  authApiBaseUrl: string
  authApiServiceToken: string
  awsRegion: string
  userPoolId: string
  clientId: string
  issuer: string
  jwksUri: string
}

export type AuthConfig = BaseConfig & {
  mock: MockConfig
  remote: RemoteConfig
}

function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback

  if (value === undefined || value === '') {
    throw new Error(`Missing required auth environment variable: ${name}`)
  }

  return value
}

function readNumberEnv(name: string, fallback: number) {
  const raw = process.env[name]

  if (!raw) return fallback

  const parsed = Number(raw)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected ${name} to be a positive number`)
  }

  return parsed
}

function buildConfig(): AuthConfig {
  const appBaseUrl = readEnv('APP_BASE_URL', 'http://localhost:3434')
  const authMode = (process.env.AUTH_MODE ?? 'mock') as AuthMode

  if (authMode !== 'mock' && authMode !== 'remote') {
    throw new Error(`Unsupported AUTH_MODE "${authMode}"`)
  }

  const sessionSecret = readEnv('AUTH_SESSION_SECRET', 'dev-session-secret-change-me-at-least-32')

  if (sessionSecret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must be at least 32 characters long')
  }

  const secureCookies =
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' && appBaseUrl.startsWith('https://'))

  const awsRegion = process.env.COGNITO_AWS_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-1'
  const userPoolId = process.env.COGNITO_USER_POOL_ID ?? 'local-user-pool'
  const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID ?? 'local-client-id'
  const issuer =
    process.env.COGNITO_ISSUER ??
    `https://cognito-idp.${awsRegion}.amazonaws.com/${userPoolId}`

  return {
    appBaseUrl,
    authMode,
    cookieName: process.env.AUTH_COOKIE_NAME ?? 'vibe_session',
    secureCookies,
    sessionSecret,
    sessionRefreshWindowSeconds: readNumberEnv('AUTH_SESSION_REFRESH_WINDOW_SECONDS', 120),
    mock: {
      accessTokenTtlSeconds: readNumberEnv('MOCK_AUTH_ACCESS_TOKEN_TTL_SECONDS', 900),
      refreshTokenTtlSeconds: readNumberEnv('MOCK_AUTH_REFRESH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 7),
      username: process.env.MOCK_AUTH_USERNAME ?? 'demo@example.com',
      password: process.env.MOCK_AUTH_PASSWORD ?? 'ChangeMe123!',
      email: process.env.MOCK_AUTH_EMAIL ?? 'demo@example.com',
      displayName: process.env.MOCK_AUTH_DISPLAY_NAME ?? 'Demo User',
      issuer: process.env.MOCK_AUTH_ISSUER ?? `${appBaseUrl}/mock-cognito`,
      clientId: process.env.MOCK_AUTH_CLIENT_ID ?? 'mock-web-client',
      jwtSecret: readEnv('MOCK_AUTH_JWT_SECRET', 'mock-jwt-secret-change-me-at-least-32'),
    },
    remote: {
      authApiBaseUrl: readEnv('AUTH_API_BASE_URL', 'http://localhost:3434'),
      authApiServiceToken: readEnv('AUTH_API_SERVICE_TOKEN', 'dev-auth-api-service-token'),
      awsRegion,
      userPoolId,
      clientId,
      issuer,
      jwksUri:
        process.env.COGNITO_JWKS_URI ??
        `${issuer}/.well-known/jwks.json`,
    },
  }
}

let cachedConfig: AuthConfig | null = null

export function getAuthConfig() {
  if (!cachedConfig) {
    cachedConfig = buildConfig()
  }

  return cachedConfig
}

export function resetAuthConfigForTests() {
  cachedConfig = null
}

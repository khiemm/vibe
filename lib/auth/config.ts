import type { AuthMode } from '@/lib/auth/contracts'

type BaseConfig = {
  appBaseUrl: string
  authMode: AuthMode
  cookieName: string
  secureCookies: boolean
  sessionSecret: string
  sessionRefreshWindowSeconds: number
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
  const authMode = (process.env.AUTH_MODE ?? 'remote') as AuthMode
  const sessionSecret = readEnv('AUTH_SESSION_SECRET')

  if (authMode !== 'remote' && authMode !== 'disabled') {
    throw new Error(`Unsupported AUTH_MODE "${authMode}"`)
  }

  if (sessionSecret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must be at least 32 characters long')
  }

  const secureCookies =
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' && appBaseUrl.startsWith('https://'))

  const awsRegion = process.env.COGNITO_AWS_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-1'
  const userPoolId =
    authMode === 'disabled' ? process.env.COGNITO_USER_POOL_ID ?? 'disabled-user-pool' : readEnv('COGNITO_USER_POOL_ID')
  const clientId =
    authMode === 'disabled'
      ? process.env.COGNITO_USER_POOL_CLIENT_ID ?? 'disabled-client-id'
      : readEnv('COGNITO_USER_POOL_CLIENT_ID')
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
    remote: {
      authApiBaseUrl:
        authMode === 'disabled'
          ? process.env.AUTH_API_BASE_URL ?? 'https://disabled.invalid'
          : readEnv('AUTH_API_BASE_URL'),
      authApiServiceToken:
        authMode === 'disabled'
          ? process.env.AUTH_API_SERVICE_TOKEN ?? 'disabled-service-token'
          : readEnv('AUTH_API_SERVICE_TOKEN'),
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

export function isAuthDisabled() {
  return getAuthConfig().authMode === 'disabled'
}

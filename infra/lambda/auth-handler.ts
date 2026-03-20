import { randomUUID } from 'node:crypto'
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
  RevokeTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import type {
  AuthServiceErrorShape,
  AuthServiceSuccess,
  RefreshSessionRequest,
  SignInRequest,
  SignOutRequest,
} from '../../lib/auth/contracts'

type SessionRecord = {
  sessionId: string
  username: string
  sub?: string
  email?: string
  refreshToken: string
  refreshTokenExpiresAt: number
  ttl: number
  createdAt: string
  updatedAt: string
  revokedAt?: string
}

type EnvConfig = {
  userPoolId: string
  userPoolClientId: string
  tableName: string
  serviceTokenSecretArn: string
  refreshTokenTtlDays: number
}

const cognito = new CognitoIdentityProviderClient({})
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const secrets = new SecretsManagerClient({})

let cachedServiceToken: string | null = null

function getEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getConfig(): EnvConfig {
  return {
    userPoolId: getEnv('COGNITO_USER_POOL_ID'),
    userPoolClientId: getEnv('COGNITO_USER_POOL_CLIENT_ID'),
    tableName: getEnv('SESSION_TABLE_NAME'),
    serviceTokenSecretArn: getEnv('SERVICE_TOKEN_SECRET_ARN'),
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? '30'),
  }
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}

function nowIso() {
  return new Date().toISOString()
}

function jsonResponse(statusCode: number, body: object): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

function errorResponse(statusCode: number, code: string, message: string) {
  const body: AuthServiceErrorShape = {
    error: {
      code,
      message,
    },
  }

  return jsonResponse(statusCode, body)
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.')

  if (!payload) return {}

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function getServiceTokenSecret() {
  if (cachedServiceToken) {
    return cachedServiceToken
  }

  const config = getConfig()
  const result = await secrets.send(
    new GetSecretValueCommand({
      SecretId: config.serviceTokenSecretArn,
    }),
  )

  const rawSecret = result.SecretString ?? ''

  try {
    const parsed = JSON.parse(rawSecret) as { serviceToken?: string }
    cachedServiceToken = parsed.serviceToken ?? rawSecret
  } catch {
    cachedServiceToken = rawSecret
  }

  if (!cachedServiceToken) {
    throw new Error('The auth API service token secret is empty')
  }

  return cachedServiceToken
}

async function assertServiceToken(event: APIGatewayProxyEventV2) {
  const expectedToken = await getServiceTokenSecret()
  const receivedToken =
    event.headers['x-auth-service-token'] ?? event.headers['X-Auth-Service-Token']

  if (!receivedToken || receivedToken !== expectedToken) {
    throw new Error('invalid_service_token')
  }
}

function parseBody<T>(event: APIGatewayProxyEventV2): T {
  if (!event.body) {
    throw new Error('missing_request_body')
  }

  return JSON.parse(event.body) as T
}

async function loadSession(sessionId: string) {
  const config = getConfig()
  const result = await dynamodb.send(
    new GetCommand({
      TableName: config.tableName,
      Key: { sessionId },
    }),
  )

  return (result.Item as SessionRecord | undefined) ?? null
}

async function storeSession(record: SessionRecord) {
  const config = getConfig()

  await dynamodb.send(
    new PutCommand({
      TableName: config.tableName,
      Item: record,
    }),
  )
}

async function revokeSession(sessionId: string) {
  const config = getConfig()

  await dynamodb.send(
    new UpdateCommand({
      TableName: config.tableName,
      Key: { sessionId },
      UpdateExpression: 'SET revokedAt = :revokedAt, updatedAt = :updatedAt, ttl = :ttl',
      ExpressionAttributeValues: {
        ':revokedAt': nowIso(),
        ':updatedAt': nowIso(),
        ':ttl': nowInSeconds() + 60 * 60 * 24,
      },
    }),
  )
}

function makeAuthSuccess(input: {
  sessionId: string
  accessToken: string
  idToken: string
  expiresIn: number
  refreshTokenExpiresAt: number
}): AuthServiceSuccess {
  return {
    sessionId: input.sessionId,
    accessToken: input.accessToken,
    idToken: input.idToken,
    accessTokenExpiresAt: nowInSeconds() + input.expiresIn,
    refreshTokenExpiresAt: input.refreshTokenExpiresAt,
  }
}

async function handleLogin(event: APIGatewayProxyEventV2) {
  const config = getConfig()
  const input = parseBody<SignInRequest>(event)

  if (!input.username || !input.password) {
    return errorResponse(400, 'missing_credentials', 'Username and password are required')
  }

  try {
    const response = await cognito.send(
      new AdminInitiateAuthCommand({
        UserPoolId: config.userPoolId,
        ClientId: config.userPoolClientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: input.username,
          PASSWORD: input.password,
        },
      }),
    )

    const authResult = response.AuthenticationResult

    if (!authResult?.AccessToken || !authResult.IdToken || !authResult.RefreshToken || !authResult.ExpiresIn) {
      if (response.ChallengeName) {
        return errorResponse(
          409,
          'challenge_not_supported',
          `The auth flow returned the unsupported challenge ${response.ChallengeName}`,
        )
      }

      return errorResponse(502, 'missing_tokens', 'Cognito did not return a complete token set')
    }

    const sessionId = randomUUID()
    const refreshTokenExpiresAt = nowInSeconds() + config.refreshTokenTtlDays * 24 * 60 * 60
    const tokenClaims = decodeJwtPayload(authResult.IdToken)

    await storeSession({
      sessionId,
      username: input.username,
      sub: typeof tokenClaims.sub === 'string' ? tokenClaims.sub : undefined,
      email: typeof tokenClaims.email === 'string' ? tokenClaims.email : undefined,
      refreshToken: authResult.RefreshToken,
      refreshTokenExpiresAt,
      ttl: refreshTokenExpiresAt,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })

    return jsonResponse(
      200,
      makeAuthSuccess({
        sessionId,
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        expiresIn: authResult.ExpiresIn,
        refreshTokenExpiresAt,
      }),
    )
  } catch (error) {
    console.error('login_failed', error)
    return errorResponse(401, 'invalid_credentials', 'The provided credentials were rejected')
  }
}

async function handleRefresh(event: APIGatewayProxyEventV2) {
  const config = getConfig()
  const input = parseBody<RefreshSessionRequest>(event)

  if (!input.sessionId) {
    return errorResponse(400, 'missing_session_id', 'Session ID is required')
  }

  const session = await loadSession(input.sessionId)

  if (!session || session.revokedAt) {
    return errorResponse(401, 'session_not_found', 'The session no longer exists')
  }

  if (session.refreshTokenExpiresAt <= nowInSeconds()) {
    return errorResponse(401, 'session_expired', 'The refresh token has expired')
  }

  try {
    const response = await cognito.send(
      new AdminInitiateAuthCommand({
        UserPoolId: config.userPoolId,
        ClientId: config.userPoolClientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: session.refreshToken,
        },
      }),
    )

    const authResult = response.AuthenticationResult

    if (!authResult?.AccessToken || !authResult.IdToken || !authResult.ExpiresIn) {
      return errorResponse(502, 'missing_tokens', 'Cognito did not return refreshed access tokens')
    }

    await dynamodb.send(
      new UpdateCommand({
        TableName: config.tableName,
        Key: { sessionId: input.sessionId },
        UpdateExpression: 'SET updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': nowIso(),
        },
      }),
    )

    return jsonResponse(
      200,
      makeAuthSuccess({
        sessionId: input.sessionId,
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        expiresIn: authResult.ExpiresIn,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      }),
    )
  } catch (error) {
    console.error('refresh_failed', error)
    return errorResponse(401, 'session_expired', 'The session could not be refreshed')
  }
}

async function handleLogout(event: APIGatewayProxyEventV2) {
  const config = getConfig()
  const input = parseBody<SignOutRequest>(event)

  if (!input.sessionId) {
    return errorResponse(400, 'missing_session_id', 'Session ID is required')
  }

  const session = await loadSession(input.sessionId)

  if (!session) {
    return jsonResponse(200, { ok: true })
  }

  try {
    await cognito.send(
      new RevokeTokenCommand({
        ClientId: config.userPoolClientId,
        Token: session.refreshToken,
      }),
    )
  } catch (error) {
    console.error('revoke_failed', error)
  }

  await revokeSession(input.sessionId)

  return jsonResponse(200, { ok: true })
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    await assertServiceToken(event)

    if (event.requestContext.http.method === 'POST' && event.rawPath.endsWith('/auth/login')) {
      return handleLogin(event)
    }

    if (event.requestContext.http.method === 'POST' && event.rawPath.endsWith('/auth/refresh')) {
      return handleRefresh(event)
    }

    if (event.requestContext.http.method === 'POST' && event.rawPath.endsWith('/auth/logout')) {
      return handleLogout(event)
    }

    return errorResponse(404, 'not_found', 'The requested route does not exist')
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_service_token') {
      return errorResponse(403, 'invalid_service_token', 'The auth API service token was rejected')
    }

    console.error('auth_api_unexpected_error', error)
    return errorResponse(500, 'internal_error', 'The auth service failed unexpectedly')
  }
}

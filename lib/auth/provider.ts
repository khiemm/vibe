import type {
  AuthServiceSuccess,
  RefreshSessionRequest,
  SignInRequest,
  SignOutRequest,
} from '@/lib/auth/contracts'
import { getAuthConfig } from '@/lib/auth/config'
import { AuthError } from '@/lib/auth/errors'
import { isAuthServiceErrorShape, isAuthServiceSuccess } from '@/lib/auth/contracts'

type AuthProvider = {
  signIn: (input: SignInRequest) => Promise<AuthServiceSuccess>
  refresh: (input: RefreshSessionRequest) => Promise<AuthServiceSuccess>
  signOut: (input: SignOutRequest) => Promise<void>
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function remoteRequest<TRequest extends object, TResponse>(
  path: string,
  input: TRequest,
): Promise<TResponse> {
  const config = getAuthConfig()
  const response = await fetch(`${config.remote.authApiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-auth-service-token': config.remote.authApiServiceToken,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  const data = await readJson(response)

  if (!response.ok) {
    if (isAuthServiceErrorShape(data)) {
      throw new AuthError(response.status, data.error.code, data.error.message)
    }

    throw new AuthError(response.status, 'upstream_auth_error', 'The auth service rejected the request')
  }

  return data as TResponse
}

const remoteProvider: AuthProvider = {
  async signIn(input) {
    const data = await remoteRequest('/auth/login', input)

    if (!isAuthServiceSuccess(data)) {
      throw new AuthError(502, 'invalid_auth_response', 'The auth service returned an invalid login payload')
    }

    return data
  },
  async refresh(input) {
    const data = await remoteRequest('/auth/refresh', input)

    if (!isAuthServiceSuccess(data)) {
      throw new AuthError(502, 'invalid_auth_response', 'The auth service returned an invalid refresh payload')
    }

    return data
  },
  async signOut(input) {
    await remoteRequest('/auth/logout', input)
  },
}

const disabledProvider: AuthProvider = {
  async signIn() {
    throw new AuthError(503, 'auth_disabled', 'Authentication is currently disabled')
  },
  async refresh() {
    throw new AuthError(503, 'auth_disabled', 'Authentication is currently disabled')
  },
  async signOut() {
    return
  },
}

export function getAuthProvider(): AuthProvider {
  return getAuthConfig().authMode === 'disabled' ? disabledProvider : remoteProvider
}

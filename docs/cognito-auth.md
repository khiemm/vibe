# Cognito Auth

## Architecture

The authentication flow is intentionally server-centric:

- `Next.js` acts as the backend-for-frontend and owns the browser session.
- The browser never stores auth state in `localStorage`.
- The app sets one encrypted HTTP-only cookie that contains only session metadata and a server session ID.
- In `mock` mode, Next issues locally signed JWTs for testing and stores mock sessions in memory.
- In `remote` mode, Next talks to the serverless auth API over a shared service token.
- The auth API uses `Cognito` for password authentication and refresh.
- `DynamoDB` stores refresh-token-backed session records keyed by session ID.
- `Secrets Manager` stores the shared BFF-to-auth-API token and the Next session secret.
- `SSM Parameter Store` publishes the non-secret values the Next app needs at runtime.

The implementation uses the direct Cognito auth API instead of Hosted UI.

Why:

- It keeps the login experience first-party inside the Next app.
- It fits the BFF pattern cleanly because the browser only talks to Next.
- It makes local mock testing much simpler.
- Passwords are still only verified by Cognito and are never stored by the app.

If you later need social login, enterprise federation, or OAuth consent flows, Hosted UI is the right next step.

## Local Run

1. Copy `.env.example` values into `.env.local`.
2. Keep `AUTH_MODE=mock`.
3. Set `AUTH_SESSION_SECRET` and `MOCK_AUTH_JWT_SECRET` to strong values.
4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3434/sign-in`.
6. Use the mock credentials from `.env.local`.
7. Confirm that:

- `/protected` redirects to `/sign-in` when signed out
- sign-in sets the cookie and renders `/protected`
- `/api/protected/profile` returns `401` when signed out and a user payload when signed in
- logout clears the cookie

## Validation Commands

Run the local validation loop with:

```bash
npx tsc --noEmit
npm test
npm run cdk:synth
```

## CDK Stack

The CDK stack entrypoint is:

```bash
infra/bin/auth-app.ts
```

Synth uses:

```bash
npm run cdk:synth
```

The stack provisions:

- Cognito user pool
- Cognito app client for server-side auth
- API Gateway HTTP API
- Lambda auth handler
- DynamoDB session table with TTL
- Lambda IAM permissions for Cognito, DynamoDB, and Secrets Manager
- CloudWatch log group for the auth Lambda
- SSM parameters for runtime discovery
- Secrets Manager secrets for the BFF service token and Next session secret

## Runtime Env Mapping

For deployed Next.js environments, set:

- `AUTH_MODE=remote`
- `APP_BASE_URL`
- `AUTH_SESSION_SECRET`
- `AUTH_API_BASE_URL`
- `AUTH_API_SERVICE_TOKEN`
- `COGNITO_AWS_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_USER_POOL_CLIENT_ID`
- `COGNITO_ISSUER`
- `COGNITO_JWKS_URI`

The CDK stack publishes the non-secret values into SSM and the secret ARNs into SSM as references.

## Manual AWS Setup

These steps are still manual by design:

1. Bootstrap CDK in the target account if it has not been bootstrapped yet.
2. Deploy the stack:

```bash
npx cdk deploy
```

3. Create at least one Cognito user because self sign-up is disabled.
4. Set a permanent password for that user.
5. Retrieve the generated service token secret and Next session secret from Secrets Manager.
6. Inject the SSM/Secrets values into your deployed Next.js environment.
7. Serve the Next app over HTTPS and set `AUTH_COOKIE_SECURE=true`.

## Limitations

- The mock auth session store is in-memory and meant only for local development.
- The direct auth API path is great for BFF flows, but Hosted UI is a better fit if you need third-party identity providers.
- The DynamoDB session record stores the Cognito refresh token encrypted at rest by DynamoDB, but not application-level encrypted. Add envelope encryption if your compliance model requires it.

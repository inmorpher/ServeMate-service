---
name: auth-flow
description: "Use when you need the client-side auth contract for login, authorization header usage, token refresh, logout, /auth/me, and token lifetimes in ServeMate."
---

# ServeMate Auth Flow

Use this skill when a client agent needs the external auth contract for ServeMate: which API routes to call, what to send, what comes back, how tokens are used, and what to do on refresh or logout.

## API Routes

All auth endpoints live under /api.

The global auth middleware applies to all /api routes except:
- /auth/login
- /auth/register
- /auth/refresh-token
- /meta

Everything else under /api requires a valid access token in the Authorization header.

## Login

Route:
- POST /api/auth/login

Request body:
- email
- password

What to send:
- JSON body with valid credentials

What it returns:
- user
- accessToken
- refreshToken
- expiresIn

Response meaning:
- user: the authenticated user object
- accessToken: JWT for protected requests
- refreshToken: JWT used to get a new token pair
- expiresIn: access token lifetime in milliseconds

## Protected Requests

For any protected API call, send:
- Authorization: Bearer <accessToken>

What the server checks:
1. Presence of Authorization header.
2. Bearer format.
3. Access token signature and expiration.
4. If valid, the decoded user is attached to req.user.

If auth fails, the request is rejected with 401.

## Current User

Route:
- GET /api/auth/me

What to send:
- Valid access token in Authorization header

What it returns:
- user

Response meaning:
- user: the currently authenticated user record

If the token is missing, invalid, expired, or the user cannot be found, the route returns 401.

## Refresh Token

Route:
- POST /api/auth/refresh-token

Request body:
- refreshToken

What to send:
- JSON body with the refresh token

What it returns:
- accessToken
- refreshToken
- expiresIn

Response meaning:
- accessToken: new JWT for protected requests
- refreshToken: new refresh JWT
- expiresIn: new access token lifetime in milliseconds

If refreshToken is missing or invalid, the route returns 401.

## Logout

Route:
- POST /api/auth/logout

What to send:
- No body required

What it returns:
- message: Logged out successfully

## Token Lifetime

Current environment values in .env:
- JWT_EXPIRES_IN = 1h
- JWT_REFRESH_EXPIRES_IN = 7d

What that means:
- Access token lifetime: 1 hour
- Refresh token lifetime: 7 days

expiresIn in responses is the access token lifetime in milliseconds.

## Practical Client Flow

1. Call POST /api/auth/login with email and password.
2. Store accessToken and refreshToken from the response.
3. Send accessToken in Authorization for protected requests.
4. When accessToken expires, call POST /api/auth/refresh-token with refreshToken in the body.
5. Replace stored tokens with the refresh response.
6. On logout, call POST /api/auth/logout and discard local tokens.

## Known Issues and Planning

These are the auth-flow issues to plan fixes for next:

- Refresh/logout contract mismatch: the active flow returns tokens in JSON, but logout still clears a refreshToken cookie. Decide whether the app is cookie-based or body-based and make the flow consistent.
- Role checks are disabled outside production: RoleMiddleware skips enforcement when ENV.PRODUCTION is false. That means dev/staging can bypass RBAC.
- Sensitive logging: login currently logs the request body, which can expose passwords in plaintext.
- User service logging: user validation logs email and cache key. This should be reviewed for security and log noise.
- Token cache TTL looks suspicious: TOKEN_CACHE_TTL is currently very short in .env, so access-token caching may be ineffective.
- Exempt route allowlist contains /auth/register, but there is no visible register route in the current auth controller. Verify whether it is needed.

## Source Files

Primary files:
- src/app.ts
- src/controllers/auth/auth.controller.ts
- src/services/tokens/token.service.ts
- src/middleware/auth/auth.middleware.ts
- src/middleware/role/role.middleware.ts
- env.ts

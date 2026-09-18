---
name: auth-flow
description: 'Use when implementing or debugging ServeMate authentication for browser, mobile, or desktop clients: login, access tokens, refresh tokens, logout, /auth/me, errors, storage, and retry flow.'
---

# ServeMate Client Auth Skill

Use this skill as the client-side authentication contract for ServeMate. It describes the current API behavior, token transport, response shapes, errors, platform-specific storage, and the complete login-refresh-logout flow.

## Base URL and API Rules

All application routes are under `/api`.

Auth routes:

- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`

The server does not expose `/api/auth/register`.

The server allows `OPTIONS` requests and paths containing `/meta` without authentication. Login and refresh are public. All other API routes, including logout and `/auth/me`, require an access token.

## Token Model

There are two tokens:

- `accessToken`: short-lived JWT sent in the `Authorization` header.
- `refreshToken`: long-lived rotating token used to obtain a new token pair.

Current local lifetimes:

- Access token: `1h`.
- Refresh token: `7d`.

`expiresIn` in API responses is the access-token lifetime in milliseconds. Do not calculate refresh-token lifetime from `expiresIn`.

Never log or expose either token unnecessarily. Treat both as credentials.

## Login

### Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user-password"
}
```

Both fields are required. The password must be at least 6 characters. The email must be valid.

### Success: `200 OK`

```json
{
  "user": {
    "id": 42,
    "name": "Alex",
    "email": "user@example.com",
    "role": "USER"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": 3600000
}
```

The server also sets a `refreshToken` cookie. The cookie is `HttpOnly`, uses path `/api/auth`, and is `Secure` in production. Native clients should use the JSON token and platform secure storage; browser clients should rely on the cookie.

A login request does not require an `Authorization` header.

## Protected Requests

Send the access token exactly as a Bearer token:

```http
Authorization: Bearer <accessToken>
```

The scheme is case-sensitive in the current middleware: use `Bearer` with a capital `B`. Do not send extra whitespace-separated values.

Example:

```http
GET /api/orders
Authorization: Bearer jwt-access-token
```

The server validates the header, JWT signature, expiration, and revocation status. On success it attaches the decoded user to the request.

## Current User

### Request

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### Success: `200 OK`

```json
{
  "user": {
    "id": 42,
    "name": "Alex",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

The response user is public user data and does not include the password.

## Refresh Token

Refresh token rotation is supported. Every successful refresh invalidates the previous refresh session and returns a new access/refresh pair.

Use exactly one transport method per request.

### Cookie transport: browser

```http
POST /api/auth/refresh-token
Cookie: refreshToken=<refresh-token>
```

The request body can be empty. The browser must send credentials for cross-origin requests.

### JSON transport: mobile and desktop

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

### Important source rule

- Cookie and JSON body are both accepted.
- If both contain a token, the server returns `400`; do not send both.
- If neither contains a token, the server returns `401`.

### Success: `200 OK`

```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token",
  "expiresIn": 3600000
}
```

The server also replaces the `refreshToken` HttpOnly cookie. Native clients must persist the returned `refreshToken` and discard the previous one.

Do not retry refresh indefinitely. If refresh fails, clear local authentication state and send the user to login.

## Logout

Logout is a protected route, so send the current access token:

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

For browser clients, send the refresh token through the cookie instead and enable credentials:

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
Cookie: refreshToken=<refresh-token>
```

The body is optional. If both cookie and body are present, the current server uses the cookie for logout. Avoid sending both for consistency.

### Success: `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

The server revokes the access token when supplied, revokes the refresh session when supplied, and clears the `refreshToken` cookie. The client must also clear its in-memory access token and native secure storage.

## Error Contract

Errors are JSON objects with this shape:

```json
{
  "statusCode": 401,
  "message": "Authorization header missing",
  "error": "HTTPError"
}
```

The `error` value is not guaranteed to be a stable business-code identifier. Use `statusCode` and, where needed, `message` for handling.

### Common errors

| Status | Situation                                                      | Client action                                                       |
| ------ | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `400`  | Refresh token was sent in both cookie and body.                | Send only one transport method.                                     |
| `401`  | Missing, malformed, expired, invalid, or revoked access token. | Try refresh once if a refresh token exists; otherwise login.        |
| `401`  | Missing, invalid, expired, revoked, or inactive refresh token. | Clear auth state and login again.                                   |
| `401`  | Invalid login credentials.                                     | Show a generic credentials error; do not reveal which field failed. |
| `422`  | Login body validation failed.                                  | Fix email/password format and retry.                                |
| `403`  | Authenticated user lacks the required role.                    | Do not retry; show an authorization error.                          |
| `500`  | Unexpected server error.                                       | Show a generic error and retry only with backoff where appropriate. |

Examples of authentication errors include:

- `Authorization header missing`
- `Invalid Authorization header format`
- `Invalid token`
- `Refresh token not provided`
- `Invalid refresh token`
- `User is not authenticated`

Do not treat every `401` as a signal to refresh blindly. Refresh only for a failed protected request, perform one refresh attempt, then retry the original request once.

## Client Flow

### Browser

1. Call login with credentials.
2. Keep `accessToken` in memory where possible.
3. Let the browser store the HttpOnly `refreshToken` cookie.
4. Send `Authorization: Bearer <accessToken>` for protected requests.
5. Send `credentials: 'include'` or the equivalent HTTP-client option for login, refresh, and logout when the API is cross-origin.
6. On one access-token `401`, call refresh with credentials and no JSON refresh token.
7. Replace the in-memory access token and retry the original request once.
8. On refresh failure, clear memory and show login.

Example with `fetch`:

```ts
await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

await fetch('/api/auth/refresh-token', {
  method: 'POST',
  credentials: 'include',
});
```

### Mobile and desktop

1. Call login.
2. Keep `accessToken` in memory or short-lived application state.
3. Store `refreshToken` only in platform secure storage: iOS Keychain, Android Keystore-backed storage, Windows Credential Manager, macOS Keychain, or Linux Secret Service.
4. Send the access token in the Authorization header.
5. On one access-token `401`, load the refresh token and send it in JSON body.
6. Persist the rotated refresh token and replace the access token.
7. Retry the original request once.
8. On refresh failure, delete secure storage and show login.

Example native refresh request:

```ts
await fetch(`${baseUrl}/api/auth/refresh-token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});
```

## Concurrency and Retry Rules

When several requests receive `401` at the same time, use one shared refresh operation. Queue other failed requests behind it instead of sending multiple refresh requests. This matters because refresh-token rotation invalidates the previous session after the first successful refresh.

Recommended behavior:

- Refresh at most once for an original request.
- Retry the original request at most once.
- Never retry login automatically with the same credentials.
- If refresh returns `401`, clear all tokens and stop the queue.
- If refresh returns `400`, fix the client so it sends only cookie or body.

## CORS and Cookie Requirements

For a browser frontend on another origin:

- Send requests with credentials enabled.
- The server must allow the exact frontend origin, not `*`, when credentials are used.
- The current server allows a configured list of localhost and LAN origins; add a deployed frontend origin to the server configuration before deployment.
- Do not attempt to read the HttpOnly cookie from JavaScript.

The current cookie path is `/api/auth`. Production cookies are `Secure` and use `SameSite=Strict`; development cookies use `SameSite=Lax`.

## Security Rules

- Never put access or refresh tokens in URLs, query parameters, logs, analytics events, or error reports.
- Prefer an HttpOnly cookie for browser refresh tokens.
- Prefer OS secure storage for mobile and desktop refresh tokens.
- Keep access tokens out of persistent browser storage unless the threat model explicitly requires it.
- Do not log login request bodies or token values.
- Clear tokens on logout, refresh failure, account switch, and authentication reset.
- Treat `403` as an authorization failure, not an authentication-refresh signal.

## Current Limitations

- There is no `/api/auth/register` endpoint.
- There is no password reset or email verification flow documented by the current auth controller.
- The login response includes `refreshToken` even for browser clients, although browsers should use the HttpOnly cookie.
- The server's allowed CORS origins are currently configured in `src/app.ts`; deployed clients need their origin added there.

## Source Files

Primary implementation files:

- `src/app.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.middleware.ts`
- `src/auth/auth.service.ts`
- `src/auth/token.service.ts`
- `src/auth/dto/auth.dto.ts`
- `src/middleware/role/role.middleware.ts`
- `env.ts`

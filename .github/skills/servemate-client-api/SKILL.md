---
name: servemate-client-api
description: 'Use when building or debugging a ServeMate client against the REST API: authentication, access and refresh tokens, cookies, protected routes, request DTOs, response shapes, validation errors, roles, workspace bootstrap, orders, reservations, payments, tables, food items, or drink items.'
---

# ServeMate Client API

Use this skill as the client-side integration contract for the ServeMate backend.
The backend is an Express REST API. Unless a deployment configuration says otherwise,
the local origin is `http://localhost:3000` and every API path starts with `/api`.

## Source of truth

When this document conflicts with code, verify the current contract in this order:

1. `generated/openapi.json` and `/docs/openapi.json` for schemas and query fields.
2. The relevant controller and DTO schema under `src/<domain>/` for runtime behavior.
3. This skill for client workflow and integration rules.

Do not invent routes such as `/auth/register`: there is no registration route in the
current backend. Do not assume every successful response has a `{ data: ... }` wrapper;
controllers return the resource, list, string, message object, or no body directly.

## HTTP client rules

- Send JSON with `Content-Type: application/json` for requests with a body.
- Send `Authorization: Bearer <accessToken>` on every protected request.
- Send `credentials: 'include'` (or the equivalent in the client library) on login,
  refresh, logout, and any request that must receive/send the `refreshToken` cookie.
- Keep the access token in memory when possible. The refresh token is issued as an
  HttpOnly cookie named `refreshToken`; do not read that cookie from browser JavaScript.
- In development the refresh cookie is `SameSite=Lax`; in production it is `Secure` and
  `SameSite=Strict`, with path `/api/auth`.
- On a successful refresh, replace the old access token with the returned new one. Refresh
  token rotation also occurs, so preserve the new cookie returned by the server.
- Do not retry a failed request indefinitely. Retry once after a 401 by refreshing the
  session; if refresh fails, clear the session and send the user to login.

## Authentication flow

### Login

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Success (`200`) contains:

```json
{
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@example.com",
    "role": "USER"
  },
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": "..."
}
```

The server also sets the `refreshToken` HttpOnly cookie. Treat the cookie as the browser
storage mechanism even though the current response also exposes `refreshToken` in JSON.

### Restore session

1. Load any in-memory access token.
2. Call `GET /api/auth/me` with the Bearer token.
3. If the access token is missing or expired, call `POST /api/auth/refresh-token` with
   `credentials: 'include'` and no body when the cookie is available.
4. Store the returned `accessToken`, then call `/api/auth/me` again if user data is needed.

`POST /api/auth/refresh-token` accepts a refresh token either in the cookie or in the body:

```json
{ "refreshToken": "..." }
```

Never send both. The server returns `400` when both are supplied and `401` when neither
is supplied or the refresh token is invalid.

### Logout

`POST /api/auth/logout` requires the access token and `credentials: 'include'`.
It revokes the active tokens and clears the cookie. Success:

```json
{ "message": "Logged out successfully" }
```

After logout, clear the client-side access token and cached user/workspace data.

## Response and error contract

Successful responses use the status codes below:

- `200`: normal reads and updates; some creates also use `200`.
- `201`: order/table creation; the response has no body.
- `204`: successful delete or command with no body.

Standard errors are JSON:

```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "HTTPError"
}
```

Typical meanings:

- `400`: invalid JSON/query/body, validation failure, or conflicting refresh token input.
- `401`: missing/invalid Bearer token, invalid credentials, or invalid refresh token.
- `403`: authenticated user lacks the required role.
- `404`: resource does not exist.
- `500`: unexpected backend failure; show a generic error and keep diagnostics out of UI.

Validation coerces many URL/query values to numbers or booleans on the server, but the
client should still send correctly typed values and ISO date-time strings.

## Route catalog

All routes below are under `/api` and require authentication unless marked otherwise.
`ADMIN/MANAGER` means the authenticated user must have one of those roles.

### Auth

| Method | Route                 | Purpose                                             | Access                        |
| ------ | --------------------- | --------------------------------------------------- | ----------------------------- |
| POST   | `/auth/login`         | Exchange email/password for user and token pair     | Public                        |
| POST   | `/auth/refresh-token` | Rotate refresh session and issue a new access token | Public with cookie/body token |
| POST   | `/auth/logout`        | Revoke session and clear refresh cookie             | Bearer                        |
| GET    | `/auth/me`            | Return current user as `{ user }`                   | Bearer                        |

### Users

| Method | Route        | Purpose                                 | Access        |
| ------ | ------------ | --------------------------------------- | ------------- |
| GET    | `/users`     | Paginated/filterable user list          | ADMIN/MANAGER |
| GET    | `/users/:id` | Get one user                            | ADMIN/MANAGER |
| POST   | `/users`     | Create a user                           | ADMIN/MANAGER |
| PUT    | `/users/:id` | Update a user                           | ADMIN/MANAGER |
| DELETE | `/users/:id` | Delete a user; returns a message object | ADMIN/MANAGER |

### Workspace

| Method | Route                  | Purpose                                               |
| ------ | ---------------------- | ----------------------------------------------------- |
| GET    | `/workspace`           | Get the current user's workspace                      |
| GET    | `/workspace/bootstrap` | Load the client bootstrap bundle for the current user |
| PUT    | `/workspace`           | Update the current user's workspace                   |

Use `/workspace/bootstrap` for the initial application load when the client needs the
workspace together with food, drink, order, reservation, and payment data.

### Tables

| Method | Route            | Purpose                               | Result              |
| ------ | ---------------- | ------------------------------------- | ------------------- |
| GET    | `/tables`        | List/filter tables                    | table list response |
| GET    | `/tables/:id`    | Get one table                         | table or `404`      |
| POST   | `/tables`        | Create table                          | `201`, no body      |
| PUT    | `/tables/:id`    | Update table                          | updated table       |
| DELETE | `/tables/:id`    | Delete table                          | `204`               |
| POST   | `/tables/assign` | Assign `assignedTables` to `serverId` | message string      |

`POST /tables/assign` requires `ADMIN/MANAGER`. Keep `/tables/assign` before any generic
`/tables/:id` client route matching if the client uses a custom router.

### Orders

| Method | Route               | Purpose                                                            | Result              |
| ------ | ------------------- | ------------------------------------------------------------------ | ------------------- |
| GET    | `/orders`           | List orders with filters, pagination, and sorting                  | order list response |
| GET    | `/orders/meta`      | Load filter metadata for dashboards                                | metadata object     |
| GET    | `/orders/:id`       | Get one order                                                      | order or `404`      |
| POST   | `/orders`           | Create an order                                                    | `201`, no body      |
| PATCH  | `/orders/:id/items` | Replace food/drink items                                           | `204`               |
| PATCH  | `/orders/:id`       | Update order properties such as status, comments, discount, or tip | `204`               |
| POST   | `/orders/:id/print` | Print selected item IDs                                            | `204`               |
| POST   | `/orders/:id/call`  | Mark selected order items as called                                | `204`               |
| DELETE | `/orders/:id`       | Delete an order                                                    | `204`               |

Common order query fields include `page`, `pageSize`, `tableNumbers`, `serverId`,
`serverName`, `status`, `minAmount`, `maxAmount`, `dateFrom`, `dateTo`, `allergies`,
`sortBy`, and `sortOrder`. Valid sort fields are `id`, `tableNumber`, `guestsCount`,
`orderTime`, `updatedAt`, `status`, and `totalAmount`. Send `sortOrder=asc` or `desc`.

### Reservations

| Method | Route                          | Purpose                                      |
| ------ | ------------------------------ | -------------------------------------------- |
| GET    | `/reservations`                | List/filter reservations                     |
| POST   | `/reservations`                | Create a reservation                         |
| GET    | `/reservations/:id`            | Get one reservation                          |
| PUT    | `/reservations/:id`            | Update reservation fields                    |
| PATCH  | `/reservations/:id/status`     | Update status                                |
| PATCH  | `/reservations/:id/time`       | Update reservation time                      |
| PATCH  | `/reservations/:id/tables`     | Replace attached table IDs                   |
| PATCH  | `/reservations/:id/guest-info` | Update guest contact data                    |
| PATCH  | `/reservations/:id/comment`    | Update `comments`                            |
| PATCH  | `/reservations/:id/allergies`  | Update allergy list                          |
| DELETE | `/reservations/:id`            | Delete reservation; returns a message object |

Deletion requires `ADMIN/MANAGER`. Creation/update payload fields are defined by the
reservation DTOs; use ISO date-time strings for `time`.

### Payments

| Method | Route                    | Purpose                           |
| ------ | ------------------------ | --------------------------------- |
| GET    | `/payments`              | Paginated/filterable payment list |
| GET    | `/payments/:id`          | Get one payment                   |
| POST   | `/payments/order/:id`    | Create payment for an order       |
| POST   | `/payments/complete/:id` | Complete payment                  |
| POST   | `/payments/refund/:id`   | Refund payment                    |
| POST   | `/payments/cancel/:id`   | Cancel payment                    |

Refund requires `ADMIN/MANAGER`. Payment list supports pagination and filters such as
`orderId`, `status`, `sortBy`, and `sortOrder`.

### Menu items

Food and drink items follow the same shape:

| Method | Food route        | Drink route        | Purpose            |
| ------ | ----------------- | ------------------ | ------------------ |
| GET    | `/food-items`     | `/drink-items`     | Search/list items  |
| GET    | `/food-items/:id` | `/drink-items/:id` | Get one item       |
| POST   | `/food-items`     | `/drink-items`     | Create item        |
| PATCH  | `/food-items/:id` | `/drink-items/:id` | Update item        |
| DELETE | `/food-items/:id` | `/drink-items/:id` | Delete item; `204` |

Create/update/delete drink operations require `ADMIN/MANAGER`. Food item role rules are
currently less restrictive in the controller, so do not add a client-side role block for
food routes unless product requirements demand it; the server remains authoritative.

## Implementation pattern

Keep API access in one client module. A minimal fetch wrapper should:

1. Prefix relative routes with the configured API base URL.
2. Add the current Bearer access token.
3. Set `credentials: 'include'`.
4. Parse JSON only when a response body exists; handle `204` without parsing.
5. Convert non-2xx responses into an error carrying `statusCode`, `message`, and `error`.
6. Coordinate one refresh request for concurrent 401 responses, then retry each request once.

Do not duplicate token rotation logic inside individual screens or feature components.
Keep route DTO types close to the API client and regenerate/update them when the backend
OpenAPI or Zod DTOs change.

## Maintenance checklist

When backend routes, DTOs, roles, cookies, or response status codes change:

- update `generated/openapi.json` through the repository's generation flow;
- update this skill's route/auth section;
- update the client API types and focused auth/API tests;
- verify login, refresh, logout, `/auth/me`, one protected list request, and one `204` request.

## Client-side storage and workspace state

- Store the access token in memory whenever possible.
- Do not read or persist the refresh token from JavaScript. The backend manages it
  through the HttpOnly `refreshToken` cookie.
- Treat `user` and `workspace` as application state, not as permanent auth data.
- On application startup, call `GET /api/workspace/bootstrap` after authentication
  is restored. Use its response to initialize workspace, menu, orders,
  reservations, and payments needed by the client.
- Local persistence of workspace data is optional and should only be used as a
  short-lived cache. The server remains the source of truth.
- Never use stale cached workspace data to authorize actions or determine user roles.
  Use the authenticated user returned by `/api/auth/me`.
- After workspace mutations, update the in-memory state and invalidate the related
  cache.
- On logout, refresh failure, or user switch, clear user, workspace, and all
  user-scoped query/cache data.
- Never persist access tokens, refresh tokens, payment secrets, or other sensitive
  credentials in `localStorage`.

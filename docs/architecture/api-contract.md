# BruvHub API Contract (frontend baseline)

**Project:** BruvHub  
**Source of truth for this file:** frontend integration code in this repository, primarily `src/lib/api-client.ts`, `src/lib/data.ts`, `src/lib/auth.tsx`, `src/lib/types.ts`, `src/routes/settings.tsx`, `src/routes/portal.tsx`.

This is **not** a backend specification. Anything not visible in those files is marked:

**To be verified against backend implementation.**

No ASP.NET controllers, OpenAPI document, or database schema exist in this repository.

---

## 1. Base URL and configuration

Implemented in `src/lib/api-client.ts`.

Resolution order:

1. Browser `localStorage` key `stackedhub.apiUrl` (set from Settings: `src/routes/settings.tsx`)
2. Else `import.meta.env.VITE_API_BASE_URL` (empty string if unset)

`setApiBaseUrl` trims trailing `/`. Empty value removes the stored URL.

`isLiveApi()` is true when the resolved base URL string is non-empty.

Settings “Test connection” calls `GET` by default (`fetch` with no method) at `{base}{endpoints.health}` (`/health`). Saving the URL also clears `stackedhub.user` and `stackedhub.jwt` and navigates to `/`.

**To be verified against backend implementation:** which host/port the API actually uses. README mentions `http://localhost:5000`; Settings placeholder is `http://localhost:5032`.

---

## 2. Bearer token and JSON requests

`apiRequest` (`src/lib/api-client.ts`):

- Sends `Content-Type: application/json` on every call.
- If `tokenStore.get()` is set, also sends `Authorization: Bearer <token>`.
- Token storage key: `stackedhub.jwt`.
- Live login (`src/lib/auth.tsx`) stores `res.token`.
- Demo login stores `demo.{role}.token` (not a real JWT).
- `fetch` URL is `{base}{path}`.
- HTTP 204: returns `undefined` (typed as `T`).
- Other success: `response.json()` cast to `T` — **no runtime schema validation.**

Settings health check does **not** use `apiRequest` and does **not** attach the Bearer token.

**To be verified against backend implementation:** token format, expiry, refresh, and whether `/health` requires auth.

---

## 3. Error handling (frontend)

`ApiError` carries `message` and `status` (`0` for missing base URL or network failure).

| Condition | Frontend behaviour |
|---|---|
| No base URL | `ApiError("API address is not set (demo mode).", 0)` |
| Network failure | `ApiError("Can't reach the API at {base}. Is it running?", 0)` |
| HTTP 401 | `ApiError("Your session has expired or the details are wrong. Please sign in again.", 401)` |
| HTTP 403 | `ApiError("Your account doesn't have access to this.", 403)` |
| Other non-OK | Message from JSON `error` or `title` if present, else body text / `statusText` |

`AppShell` does **not** clear the session on 401. That is client behaviour, not an API rule.

**To be verified against backend implementation:** actual error payload shape (`error` vs `title` vs ProblemDetails).

---

## 4. Endpoints referenced by the frontend

All paths are from `endpoints` in `src/lib/api-client.ts`. Methods are listed only where this repo sets them (or uses default `GET` via `fetch`/`apiRequest` with no `method`).

### 4.1 Called from UI routes

| Path | Method (frontend) | Caller | Request body (frontend) | Response type assumed by frontend |
|---|---|---|---|---|
| `/health` | default GET | `settings.tsx` (`fetch`) | none | Not parsed; only `res.ok` / status |
| `/api/auth/login` | `POST` | `auth.tsx` `signIn` | `{ email, password }` | `{ token: string; user: AuthUser }` |
| `/api/ai/recommendations` | `POST` | `portal.tsx` | `{ prompt }` | `Array<{ name: string; reason: string }>` |

`AuthUser` is the frontend type (`id`, `name`, `email`, `role`, optional `loyaltyPoints`). **To be verified against backend implementation.**

Login does **not** send `role` in the live request body; the sign-in UI still collects a role for demo mode.

### 4.2 Called only from unused `src/lib/data.ts`

Routes do not import `data.ts`. These are **intended** frontend calls, not proven UI integrations.

| Path | Method | Function | Body sent | Assumed response |
|---|---|---|---|---|
| `/api/staff/orders` | default GET | `getOrderQueue` | none | `Order[]` |
| `/api/staff/orders/{id}/status` | `PATCH` | `updateOrderStatus` | `{ status }` where `status` is frontend `OrderStatus` | `Order` |
| `/api/staff/menu/{id}/availability` | `PATCH` | `setAvailability` | `{ available: boolean }` | `MenuItem` |
| `/api/menu` | default GET | `getMenu` | none | `MenuItem[]` |
| `/api/admin/menu` | `POST` | `saveMenuItem` (no id) | `MenuInput` (`MenuItem` without `id`) | `MenuItem` |
| `/api/admin/menu/{id}` | `PUT` | `saveMenuItem` (with id) | `MenuInput` | `MenuItem` |
| `/api/admin/users` | default GET | `getUsers` | none | `AuthUser[]` — then frontend sets `active: true` on every user |
| `/api/admin/users/{id}` | `PATCH` | `setUserActive` | `{ isActive: boolean }` | unused body |
| `/api/admin/reports` | default GET | `getReport` | none | `Report` (`data.ts` interface) |
| `/api/admin/audit` | default GET | `getAuditLog` | none | `AuditLogEntry[]` |

**To be verified against backend implementation:** HTTP methods, path templates, request/response DTOs, pagination, and whether `getUsers` returns an `active` / `isActive` field (frontend currently overwrites live users to `active: true`).

There is **no** menu DELETE helper in `data.ts`.

### 4.3 Declared but not called anywhere in `src/`

| Path constant | Path |
|---|---|
| `register` | `/api/auth/register` |
| `forgotPassword` | `/api/auth/forgot-password` |
| `customers` | `/api/customers` |
| `promotions` | `/api/promotions` |

**To be verified against backend implementation.** No request/response types can be documented from this repo.

### 4.4 Not present in `endpoints`

No Customer order-create, order-by-id, checkout, payment-method, or pickup path is defined.

---

## 5. Frontend domain types used as implied DTOs

These are TypeScript interfaces the client would JSON-parse into. They are **not** proven backend contracts.

### Order status values the frontend will send/expect

From `src/lib/types.ts` / `updateOrderStatus`:

`Placed` | `In kitchen` | `Ready` | `Completed` | `Cancelled`

Requirements lifecycle (`New`, `Confirmed`, `Preparing`, `ReadyForPickup`) is **not** used in API calls from this repo.

**To be verified against backend implementation.** If the API uses requirements names, live `PATCH` status updates from `data.ts` would be incompatible until mapped.

### `Order` (implied)

`id`, `reference`, `customerId`, `customerName`, `channel`, `items[]`, `total`, `status`, `placedAt`

`channel` union: `In-store` | `Website` | `Mobile app` | `Uber Eats` | `Mr D` | `WhatsApp`

### `MenuItem` / `MenuInput` (implied)

`name`, `description`, `category`, `price`, `stock`, `lowStockThreshold`, `spicy`, `available` (+ `id` on `MenuItem`)

### `Report` (implied, `data.ts` only)

`orderCount`, `completedSales`, `hourlyOrders[]`, `revenueByDay[]`, `bestSellers[]`, `salesByChannel[]`

### `AuditLogEntry` (implied)

`id`, `actor`, `role`, `action`, `target`, `at`

---

## 6. Demo fallback behaviour

When `isLiveApi()` is false:

- `apiRequest` is not used for login; demo users in `auth.tsx` are applied.
- Feature routes read `src/lib/mock-data.ts` and keep mutations in component state (lost on refresh).
- `data.ts` would use an in-memory copy of mock data **if imported**; it currently is not.
- Portal AI uses a local `demoSuggest` delay instead of `/api/ai/recommendations`.

Configuring a base URL does **not** switch orders/menu/reports/audit/customers/promotions to the API, because those pages do not call `data.ts` or `apiRequest`.

---

## 7. Integration QA checks

Use these as checks against **this frontend**, then against a running backend when available.

1. Empty API URL → demo sign-in; Settings badge / `isLiveApi()` false.
2. Set URL → live login `POST /api/auth/login`; invalid credentials surface `ApiError` (401 path).
3. After live login, `Authorization: Bearer` is present on subsequent `apiRequest` calls.
4. `/health` reachable from Settings without assuming JSON body.
5. Confirm backend `user.role` is `Admin` | `Staff` | `Customer` (not `Administrator`) or add a mapping — **to be verified against backend implementation.**
6. Confirm backend order `status` strings match frontend `OrderStatus` or document mapping — **to be verified against backend implementation.**
7. Do not mark staff/admin CRUD as integrated until a route calls `data.ts` (or equivalent) and the backend is tested.
8. Register, forgot-password, customers, promotions, and Customer order-create have **no frontend call** to test yet.
9. Portal AI `POST /api/ai/recommendations` is extended-domain, not Must-have MVP.

---

## 8. Status summary

| Item | Status |
|---|---|
| Frontend contract | **Documented** from this repository |
| Backend compatibility | **To be verified against backend implementation.** Backend is not in this repo |
| Order lifecycle compatibility | **Requires reconciliation** — frontend statuses ≠ requirements lifecycle; API payload uses frontend names if `data.ts` is wired |
| Authentication integration | **Requires runtime testing** — live login client exists; demo login does not validate passwords; register unused |
| Data-layer wiring | **Partial** — `api-client` + `data.ts` vs mock-driven routes |
| Must-have order create / pickup / payment | **Not defined** on `endpoints` |

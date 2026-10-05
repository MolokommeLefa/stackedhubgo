# BruvHub API Contract

**Project:** BruvHub  
**Revision:** Post-merge. Pre-merge version documented **frontend expectations only** because no API lived in the tree. This revision records **both** `src/lib/*` and `backend/StackedHub.Api`.

Sources: `src/lib/api-client.ts`, `src/lib/data.ts`, `src/lib/use-load.ts`, `src/lib/auth.tsx`, `src/lib/types.ts`, `src/routes/settings.tsx`, `src/routes/portal.tsx`, plus `Contracts/ApiContracts.cs`, controllers, `OrderService`, `TokenService`, `Program.cs`, `JsonLabels.cs`.

---

## 1. Runtime host and base URL

Frontend resolution (`api-client.ts`):

1. `localStorage` `stackedhub.apiUrl` (Settings)
2. Else `VITE_API_BASE_URL`

`isLiveApi()` ≡ non-empty base URL.

**API listen URL (launch profile `http`):** `http://localhost:5032`  
**Health:** `GET /health` → `{ status: "ok" }` (anonymous) (`Program.cs`).

**QA/documentation issue:** frontend `README.md` still tells testers `VITE_API_BASE_URL=http://localhost:5000`. Settings placeholder is `5032`. Using 5000 will fail connectivity (RBV-004). This documentation pass does **not** edit README.

Settings Test connection: unauthenticated `fetch` to `{base}/health`. Save clears JWT/user and returns to `/`.

---

## 2. Auth: JWT and JSON

- `apiRequest` sends `Content-Type: application/json` and `Authorization: Bearer <token>` when stored (`stackedhub.jwt`).
- Live login: `POST /api/auth/login` `{ email, password }` → `AuthResponse` `{ token, user }` (`AuthUserDto`).
- Register (API only): `POST /api/auth/register` — **no frontend call**.
- Passwords: BCrypt (`AuthController`). Inactive users: **403**. Bad credentials: **401** `{ error }`.
- JWT: HMAC-SHA256, ~12 hours, role claim `Admin` \| `Staff` \| `Customer`.
- Demo login: fake token; password ignored (DEF-009).
- No refresh token. `AppShell` does not clear session on 401.

API JSON: camelCase; `JsonStringEnumConverter` + `OrderStatusJsonConverter` / `OrderChannelJsonConverter`.

---

## 3. Frontend error handling

Unchanged: `ApiError` for missing base (0), network (0), 401, 403, other body `error` or `title`. Backend uses `{ error: "..." }` for many domain failures; invalid status → **409**.

---

## 4. Endpoints

### 4.1 Called from UI (including `data.ts` via routes)

| Path | Method | Frontend caller | Backend |
|---|---|---|---|
| `/health` | GET | `settings.tsx` | `MapGet("/health")` |
| `/api/auth/login` | POST | `auth.tsx` | `AuthController.Login` |
| `/api/ai/recommendations` | POST `{ prompt }` | `portal.tsx` only (extended) | `AiController` |
| `/api/staff/orders` | GET | `getOrderQueue` → orders, dashboard | `StaffController` |
| `/api/staff/orders/{id}/status` | PATCH `{ status }` | `updateOrderStatus` | Staff status (also `PATCH /api/orders/{id}/status`) |
| `/api/staff/menu/{id}/availability` | PATCH `{ available }` | `setAvailability` | Staff |
| `/api/menu` | GET | `getMenu` → menu, availability, dashboard | Public `MenuController` |
| `/api/admin/menu` | POST | `saveMenuItem` create | Admin |
| `/api/admin/menu/{id}` | PUT | `saveMenuItem` update | Admin — **no DELETE** |
| `/api/admin/users` | GET | `getUsers` | Admin. **Bug:** frontend then sets every `active: true` (DEF-014) despite `AuthUserDto.Active` |
| `/api/admin/users/{id}` | PATCH `{ isActive }` | `setUserActive` | Accepts `isActive` or `active` |
| `/api/admin/reports` | GET | `getReport` | Admin (`ReportDto`). Duplicate: `GET /api/reports` |
| `/api/admin/audit` | GET | `getAuditLog` | Admin. Duplicate: `GET /api/audit-logs` (tests often hit this) |

`useLoad` loads these on Staff/Admin pages. **Portal does not.**

### 4.2 Backend present — **not** in frontend `endpoints` / portal

| Path | Role | Notes |
|---|---|---|
| `POST /api/orders` | Customer | `PlacePickupAsync`; Cash/Card required; initial **`Placed`**. **Must gap in UI.** |
| `GET /api/orders` | Customer: own; Staff/Admin: queue | Tracking/queue alternative to staff path |
| `GET /api/orders/{id}` | Owner / staff | |
| `POST /api/orders/{id}/cancel` | Customer | Only while `Placed` |
| `POST /api/auth/register` | Anonymous | Creates Customer + JWT |
| `GET /api/auth/me` | Authorized | |
| `POST /api/auth/forgot-password` | Anonymous | **Stub** (always 200; no mail) |

### 4.3 Declared on frontend, unused by Must UI

`register`, `forgotPassword`, `customers`, `promotions` — APIs exist; **customers.tsx / promotions.tsx still mock**. Register UI missing (DEF-001).

---

## 5. Status and DTO alignment

Frontend and API order statuses: `Placed` \| `In kitchen` \| `Ready` \| `Completed` \| `Cancelled`.

Requirements names are **not** on the wire. VAL-001 remains open.

`OrderDto`: id, reference, customerId, customerName, channel, items, total, status, placedAt. **No `paymentMethod`.** Entity still stores Cash/Card.

Channels match frontend labels via `OrderChannelJsonConverter`.

`ReportDto` matches `data.ts` `Report` field names (camelCase).

---

## 6. Demo fallback

When `isLiveApi()` is false, `data.ts` mutates an in-memory clone of `mock-data` (lost on refresh). Staff/Admin UI uses that store.

Portal **always** uses static `mock-data` imports for menu/orders/promotions, even when live.

---

## 7. Integration QA checks (updated)

1. Empty URL → demo; Staff/Admin still use `data.ts` demo store, not raw route `useState` for those pages.
2. Live URL **`http://localhost:5032`** (not README 5000) → `/health` 200.
3. Live login with seed `Stacked123!`; wrong password → 401 (UAT-CUS-003) — **Not Run**.
4. After login, Bearer on `data.ts` calls.
5. `user.role` is `Admin` not `Administrator`.
6. Status strings `"In kitchen"` on PATCH.
7. Staff/Admin CRUD **is** wired through `data.ts` — still **UAT Not Run**.
8. Customer place-order / register **have no frontend call**.
9. Confirm portal menu still mock while `/availability` is live (DEF-007).
10. `GET /api/admin/users` then UI: deactivated users must not all show Active (DEF-014).

Backend automated coverage: `ApiFlowTests`, `OrderLifecycleTests` (see test-strategy). That is **not** UAT Pass.

---

## 8. Status summary

| Item | Status |
|---|---|
| Frontend Staff/Admin contract | Documented and **wired** via `data.ts` |
| Backend in this repo | **Yes** — ASP.NET Core + EF |
| Customer Must (create/track/pickup/payment UI) | **Not wired**; API create exists |
| Order lifecycle vs requirements | **VAL-001 open** — names aligned FE↔BE, not vs requirements |
| Authentication | API implemented; **browser UAT outstanding**; demo ignores password |
| Host port | **5032** runtime; README **5000** discrepancy |
| Menu DELETE | **Not implemented** on API or `data.ts` |
| Forgot-password | **Stub** |

# BruvHub Domain Contract

**Project:** BruvHub  
**Client:** Bruv Burger  
**Scope:** Task 2 — post-merge baseline (frontend + ASP.NET Core API in this repository)  
**Revision:** Updated after `origin/main` backend/database merge. Pre-merge findings are retained; implementation that has since landed is marked as such.

Requirements mappings that differ from code remain **pending team/consultant validation** (especially VAL-001).

## Purpose

This document records the domain model **as implemented in this repository** and maps it to the requirements-level BruvHub vocabulary.

It is a shared contract for architecture, development and QA. It does **not** prescribe that class names must match requirements names and does **not** authorise renaming working code solely for terminology.

---

## 1. Current roles (repository)

Frontend (`src/lib/types.ts`) and backend (`StackedHub.Domain.UserRole`):

```
Admin | Staff | Customer
```

JWT role claims use the same strings (`ClaimTypes.Role` / `"role"`). There is **no** `Administrator` string in application or API source.

### Mapping to requirements roles (VAL-002 — accepted implementation mapping)

| Requirements role | Implementation value | Mapping rule |
|---|---|---|
| Customer | `Customer` | Direct |
| Staff | `Staff` | Direct |
| Administrator | `Admin` | **Accepted mapping.** Do **not** rename code. |

QA and architecture documents say **Administrator (`Admin`)** when referring to the implemented role.

---

## 2. Layers that own domain types

| Layer | Location | Role |
|---|---|---|
| Frontend types | `src/lib/types.ts` | UI / `apiRequest` parse shapes |
| Frontend data access | `src/lib/data.ts`, `src/lib/use-load.ts` | Demo store **or** live API for Staff/Admin screens |
| Backend domain | `backend/StackedHub.Domain` (`Order`, `MenuItem`, `User`, `OrderLifecycle`, `Enums`) | Authoritative persistence model |
| Backend contracts | `backend/StackedHub.Api/Contracts/ApiContracts.cs` | HTTP DTOs |
| Infrastructure | `backend/StackedHub.Infrastructure` (`AppDbContext`, `DbSeeder`) | EF Core + SQLite (and configured SQL) |

Pre-merge: domain lived only in frontend TypeScript. Post-merge: **backend enums and EF entities are the live-mode source of truth**; frontend types must stay JSON-compatible.

### `AuthUser` (frontend) / `AuthUserDto` (API)

| Field | Notes |
|---|---|
| `id`, `name`, `email` | Strings (API id is numeric, serialized as string) |
| `role` | `Admin` \| `Staff` \| `Customer` |
| `loyaltyPoints` | Optional; not Must MVP |
| `active` (API only) | `AuthUserDto.Active`. Frontend `AuthUser` has no `active`. Live `getUsers()` currently forces `active: true` (DEF-014). |

### `Order` (frontend) / `OrderDto` (API)

| Field | Notes |
|---|---|
| `id`, `reference`, `customerId`, `customerName` | |
| `channel` | See §6 |
| `items`, `total`, `status`, `placedAt` | |
| Payment / pickup / special instructions | **Not on frontend `Order` or `OrderDto`.** Backend **entity** stores `PaymentMethod` and special instructions on place (`PlaceOrderRequest`). |

### `OrderItem` / `OrderItemDto`

`menuItemId`, `name`, `quantity`, `unitPrice`.

### `MenuItem` / `MenuItemDto`

`id`, `name`, `description`, `category` (Mains/Sides/Drinks/Desserts), `price`, `stock`, `lowStockThreshold`, `spicy`, `available`. No image field.

### Other types

| Type | Notes |
|---|---|
| `Customer` / `Promotion` | Extended domain. UI (`customers.tsx`, `promotions.tsx`) still uses **mock** seed; APIs exist. |
| `AuditLogEntry` / `AuditLogDto` | Admin audit UI uses `getAuditLog()` (live or demo store). |
| `ManagedUser`, `Report`, `MenuInput` | `data.ts` — **used** by users/reports/menu routes via `useLoad`. |
| Backend `PaymentMethod` | `Cash` \| `Card` — used on **place order**, not returned on `OrderDto`. |

---

## 3. Current order status values (implemented)

Frontend `OrderStatus` and backend `OrderStatus` (JSON writes `"In kitchen"` for `InKitchen`):

`Placed` | `In kitchen` | `Ready` | `Completed` | `Cancelled`

Staff happy-path (`orders.tsx` + `OrderLifecycle.cs`):

```
Placed → In kitchen → Ready → Completed
```

Allowed cancel: from `Placed`, `In kitchen`, or `Ready` (not from Completed). Customer API cancel only while `Placed`.

Invalid transitions are **enforced on the API** (`OrderLifecycle.CanTransition` → HTTP 409). The UI only offers the next `flow` step.

**Pre-merge:** UI-only flow, no server machine. **Post-merge:** frontend and backend **agree** on these names. That does **not** close VAL-001.

---

## 4. Requirements-level order lifecycle

```
New → Confirmed → Preparing → ReadyForPickup → Completed
```

`Cancelled` where permitted.

These names **do not appear** in `src/` or `backend/` domain/API code.

---

## 5. Lifecycle mapping — VAL-001 **open**

Provisional mapping for discussion only. **Not accepted** by consultant/team. Do **not** treat the implemented machine as equivalent to the requirements machine in UAT Pass criteria.

| Requirements status | Implemented status | Confidence |
|---|---|---|
| New | `Placed` | Provisional |
| Confirmed | *(none)* | **Gap** — no distinct step |
| Preparing | `In kitchen` | Provisional |
| ReadyForPickup | `Ready` | Provisional |
| Completed | `Completed` | Direct |
| Cancelled | `Cancelled` | Direct |

**Baseline rule:** do not rename functioning `OrderStatus` values solely for terminology. API tests (`Status_machine_matches_frontend_board`) lock the implemented names further.

QA against the running system uses **implemented** strings until VAL-001 is accepted.

---

## 6. Order channels

`In-store` | `Website` | `Mobile app` | `Uber Eats` | `Mr D` | `WhatsApp`

No dedicated Pickup type on `Order`/`OrderDto`. Backend `PlacePickupAsync` is the pickup **operation** (Cash/Card collection); channel defaults to `Website`. Delivery-style channels are **extended domain**.

---

## 7. Menu availability

- Field: `MenuItem.available`.
- **Staff:** `/availability` uses `getMenu` / `setAvailability` (`data.ts` → live `PATCH` or demo store).
- **Admin menu:** `getMenu` / `saveMenuItem` (create/update). No HTTP DELETE.
- **Customer portal:** still `menuItems.filter(m => m.available)` from **`src/lib/mock-data.ts`**. Staff/Admin live changes **do not** update the portal (DEF-007).
- Backend rejects ordering unavailable items (`ApiFlowTests.Unavailable_item_cannot_be_ordered`). The portal never calls that API.

---

## 8. Authentication model

| Aspect | Current behaviour |
|---|---|
| Session | `localStorage` `stackedhub.user`, `stackedhub.jwt` |
| Demo | `auth.tsx` ignores password; role tab; fake token (DEF-009) |
| Live login | `POST /api/auth/login` `{ email, password }` → `{ token, user }`. Backend: BCrypt, JWT ~12h, inactive → 403 |
| Register | **API:** `POST /api/auth/register` (Customer role). **UI:** none (DEF-001) |
| Forgot password | API stub always 200; no email/reset |
| Frontend authZ | `AppShell` `allow` redirect (UX only) |
| Backend authZ | `[Authorize]` + role attributes (DEF-010 partially resolved) |
| Home | Customer → `/portal`; Admin/Staff → `/dashboard` |

Seeded demo password (backend): `Stacked123!` (`DbSeeder`).

---

## 9. Demo mode versus live API mode

`isLiveApi()` when a non-empty base URL exists (`stackedhub.apiUrl` then `VITE_API_BASE_URL`).

Runtime API (launch profile): **`http://localhost:5032`**. Frontend README still mentions **`http://localhost:5000`** (QA/docs issue, RBV-004). `/health` is unauthenticated `{ status: "ok" }`.

| Surface | Demo (`isLiveApi` false) | Live (URL set) |
|---|---|---|
| Login | Bundled `demoUsers` | Real JWT login |
| Staff/Admin Must screens (orders, availability, menu, users, reports, audit, dashboard) | `data.ts` **in-memory** copy of mock (resets on refresh) | `data.ts` → REST |
| **Customer portal** | Mock `menuItems` / `orders` | **Still mock** for menu, cart, place-order, history. Only AI uses API. |

**Customer Must functionality still bypasses the shared live-data architecture.**

---

## 10. Known domain alignment items

1. Administrator ≡ `Admin` — **accepted mapping** (VAL-002). No rename.
2. Order statuses ≠ New → Confirmed → Preparing → ReadyForPickup — **VAL-001 open**.
3. Frontend `Order` still has no Pickup or Cash/Card fields; API place-order **does** take Cash/Card; `OrderDto` **omits** payment.
4. Frontend `endpoints` still has **no** `POST /api/orders` (backend has it).
5. Loyalty, promotions, CRM, delivery channels, AI — extended domain.
6. Portal and staff queue are **not** the same order store in the UI (backend can share; portal does not call it).

---

## 11. Baseline terminology rule

**Functioning implementation must not be changed merely to force terminology alignment.**

QA treats mapped names as equivalent **only** after VAL-001 is accepted. Until then, executed tests record implemented labels (`Placed`, `In kitchen`, `Ready`, …).

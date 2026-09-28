# BruvHub Domain Contract

**Project:** BruvHub  
**Client:** Bruv Burger  
**Scope:** Task 2 baseline — current frontend repository  
**Status:** Recorded from implementation. Requirements mappings that differ from code are **pending team/consultant validation**.

## Purpose

This document records the domain model **as implemented in this repository** and maps it to the requirements-level BruvHub vocabulary.

It is a shared contract for architecture, development and QA. It does **not** prescribe a database schema and does **not** authorise renaming working code solely to match requirements terminology.

---

## 1. Current roles (repository)

Defined in `src/lib/types.ts`:

```ts
type Role = "Admin" | "Staff" | "Customer"
```

Used by:

- `src/lib/auth.tsx` (demo accounts and live `user.role`)
- `src/components/AppShell.tsx` (nav `roles` and page `allow` lists)

There is **no** `Administrator` string in source.

### Mapping to requirements roles

| Requirements role | Current implementation value | Mapping rule |
|---|---|---|
| Customer | `Customer` | Direct |
| Staff | `Staff` | Direct |
| Administrator | `Admin` | Treat `Admin` as Administrator. Do **not** refactor solely to rename. |

QA and architecture documents should say **Administrator (`Admin`)** when referring to the implemented role.

---

## 2. Domain types in `src`

Source of truth: `src/lib/types.ts`, plus `ManagedUser` / `Report` / `MenuInput` in `src/lib/data.ts`.

### `AuthUser`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `name` | `string` | |
| `email` | `string` | |
| `role` | `Role` | `Admin` \| `Staff` \| `Customer` |
| `loyaltyPoints` | `number?` | Optional. Loyalty is **not** Must-have MVP. |

### `Order`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `reference` | `string` | Display reference, e.g. `#4821` in mock data |
| `customerId` | `string` | |
| `customerName` | `string` | |
| `channel` | union (see §6) | Not a Pickup/Delivery type field |
| `items` | `OrderItem[]` | |
| `total` | `number` | |
| `status` | `OrderStatus` | See §3 |
| `placedAt` | `string` | ISO timestamp |

**Not present on `Order`:** pickup vs delivery, payment method (Cash/Card), special instructions.

### `OrderItem`

| Field | Type |
|---|---|
| `menuItemId` | `string` |
| `name` | `string` |
| `quantity` | `number` |
| `unitPrice` | `number` |

### `MenuItem`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `name` | `string` | |
| `description` | `string` | |
| `category` | `"Mains"` \| `"Sides"` \| `"Drinks"` \| `"Desserts"` | |
| `price` | `number` | |
| `stock` | `number` | Inventory-style field; **not** Must-have MVP |
| `lowStockThreshold` | `number` | Same |
| `spicy` | `boolean` | Used by demo AI suggestions |
| `available` | `boolean` | Availability flag used by the portal menu filter |

No image field exists on `MenuItem`.

### Other types (extended domain, not Must-have MVP)

| Type | Location | Role in current UI |
|---|---|---|
| `Customer` | `types.ts` | CRM screen (`src/routes/customers.tsx`) |
| `Promotion` | `types.ts` | Promotions screen |
| `AuditLogEntry` | `types.ts` | Audit log screen (static mock) |
| `ManagedUser` | `data.ts` | `AuthUser` + `active: boolean` — **not imported by routes** |
| `Report` | `data.ts` | Aggregates for intended API reports — **not imported by routes** |
| `MenuInput` | `data.ts` | `Omit<MenuItem, "id">` for create/update |

---

## 3. Current order status values

Implemented `OrderStatus` (`src/lib/types.ts`):

`Placed` | `In kitchen` | `Ready` | `Completed` | `Cancelled`

Staff happy-path in `src/routes/orders.tsx`:

```
Placed → In kitchen → Ready → Completed
```

`Cancelled` is applied from any non-terminal state (`Completed` and `Cancelled` cannot be advanced or cancelled again). Invalid transitions are not centrally validated; the UI only offers the next `flow` step.

---

## 4. Requirements-level order lifecycle

Canonical requirements lifecycle:

```
New → Confirmed → Preparing → ReadyForPickup → Completed
```

`Cancelled` is an alternative terminal state where cancellation is permitted.

These names **do not appear** in `src/`.

---

## 5. Lifecycle mapping (pending reconciliation)

Suggested **provisional** mapping for discussion only. **Not validated** with backend or consultant.

| Requirements status | Current frontend status | Confidence |
|---|---|---|
| New | `Placed` | Provisional — semantic overlap, names differ |
| Confirmed | *(no distinct value)* | **Gap** — no matching status |
| Preparing | `In kitchen` | Provisional |
| ReadyForPickup | `Ready` | Provisional |
| Completed | `Completed` | Direct |
| Cancelled | `Cancelled` | Direct |

**Baseline rule:** do not change functioning `OrderStatus` values merely to force terminology alignment. Record the mismatch until the team agrees a mapping or a coordinated change.

---

## 6. Order channels currently represented

`Order.channel` (`src/lib/types.ts`):

`In-store` | `Website` | `Mobile app` | `Uber Eats` | `Mr D` | `WhatsApp`

There is **no** dedicated Pickup order-type field. Pickup is a Must-have MVP requirement; delivery-style channels exist in the type union as **extended domain**, not as confirmation that delivery is in MVP scope.

---

## 7. Menu availability

- Concept: boolean `MenuItem.available`.
- Customer portal (`src/routes/portal.tsx`) lists only `menuItems.filter((m) => m.available)` from `src/lib/mock-data.ts`.
- Staff/Admin menu page (`src/routes/menu.tsx`) can toggle `available` on **local React state**. That state is **not** shared with the portal.
- Intended API helper: `setAvailability()` in `src/lib/data.ts` (`PATCH` `{ available }`) — **not called by any route**.

Availability is therefore a domain field, but not yet a single shared rule across Customer and Staff views.

---

## 8. Current authentication model

Implemented in `src/lib/auth.tsx` + `src/lib/api-client.ts`.

| Aspect | Current behaviour |
|---|---|
| Session user | `localStorage` key `stackedhub.user` (`AuthUser` JSON) |
| Token | `localStorage` key `stackedhub.jwt` |
| Sign-in UI | `src/routes/index.tsx` — email, password, **role tab** |
| Demo mode | Ignores password; uses `demoUsers[role]` and a fake token `demo.{role}.token` |
| Live mode | `POST /api/auth/login` with `{ email, password }`; expects `{ token, user }` where `user` is `AuthUser` |
| Register | Endpoint constant only — **no UI, no call** |
| Authorization | Client redirect in `AppShell` if `user.role` is not in `allow`. No server enforcement in this repo |
| Post-login home | Customer → `/portal`; Admin/Staff → `/dashboard` |

Backend credential and role-claim behaviour: **to be verified against backend implementation.**

---

## 9. Demo mode versus live API mode

`isLiveApi()` in `src/lib/api-client.ts` is true when a non-empty API base URL exists:

1. `localStorage` `stackedhub.apiUrl` (Settings page), else
2. `VITE_API_BASE_URL`

If neither is set, the app is in **demo mode**.

| Mode | What the repository actually does |
|---|---|
| Demo | Sign-in uses bundled demo users. Feature pages seed from `src/lib/mock-data.ts` / local `useState`. |
| Live (configured) | Sign-in, Settings health check, and portal AI recommendations can call the API. Staff/admin CRUD helpers in `src/lib/data.ts` also branch on `isLiveApi()`, but **routes do not import `data.ts`**. |

`src/lib/data.ts` comments describe an in-memory demo store that resets on refresh. That store is unused by the UI.

---

## 10. Known domain alignment items

Pending validation / known gaps (do not treat as a silent rename list):

1. `Admin` vs requirements `Administrator` — mapped, not renamed.
2. Order statuses differ from New → Confirmed → Preparing → ReadyForPickup → Completed.
3. No Pickup order type or Cash/Card payment-method fields on `Order`.
4. No customer order-create type or API path in `src/lib/api-client.ts`.
5. Loyalty, promotions, CRM `Customer`, stock/low-stock, delivery channels, and AI suggestions exist in types/UI and are **out of Must-have MVP** unless scope is changed.
6. Customer portal and staff queue do not share one order store, so tracking and processing are not the same underlying order.

---

## 11. Baseline terminology rule

**Functioning implementation must not be changed merely to force terminology alignment.**

Where internal names differ from requirements names, use this document’s mapping. Behavioural changes (shared data source, real order creation, server-side authorization, lifecycle compatibility) require an explicit team decision, not a rename-only refactor.

QA will treat mapped names as equivalent only after the mapping in §5 is validated. Until then, tests against the running UI should use **implemented** status strings (`Placed`, `In kitchen`, `Ready`, …).

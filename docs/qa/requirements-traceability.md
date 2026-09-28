# BruvHub Requirements Traceability (Must MVP)

**Rule:** a route, TypeScript type, or `endpoints` constant is **not** Implemented.  
**Statuses (one primary per row):** `Implemented` | `Partial` | `Missing` | `Not Tested` | `Requires Backend Verification`

No row is `Implemented` for Must MVP after static review: either the behaviour is incomplete, UI-only, or unexecuted. **Not Tested** applies to execution; it is recorded in Planned QA / Test case, not used to hide Missing/Partial.

Role mapping: Administrator ≡ implemented `Admin` (`src/lib/types.ts`). See `docs/architecture/domain-contract.md`.

---

## Customer

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-001 | Register | Customer | Create an account with valid credentials | `endpoints.register` in `src/lib/api-client.ts` only. No register UI or `apiRequest` call. Sign-in is `src/routes/index.tsx`. | **Missing** | UAT register; live API when backend exists | UAT-CUS-002 | Constant ≠ feature. |
| FR-002 | Login | Customer | Authenticate before protected use | Demo: `src/lib/auth.tsx` uses `demoUsers[role]`, **any password**. Live: `POST /api/auth/login`. Session: `localStorage` `stackedhub.user` / `stackedhub.jwt`. | **Partial** | UAT demo + live | UAT-CUS-001, UAT-CUS-003 | Live login **Requires Backend Verification**. Demo is not credential auth. |
| FR-010 | Browse menu | Customer | View items (name, description, price, availability) | `src/routes/portal.tsx` lists `menuItems.filter(m => m.available)` from `src/lib/mock-data.ts`. `getMenu()` unused. | **Partial** | UAT portal menu | UAT-CUS-004 | Mock only; not live catalogue. |
| FR-012 / FR-026 | Unavailable items | Customer | Cannot order unavailable items | Portal hides `available: false` (e.g. Koeksister Bites in mock). Staff toggle in `src/routes/menu.tsx` is **separate** `useState`. | **Partial** | UAT hide + Staff toggle then Customer | UAT-CUS-005, UAT-STA-006 | Staff change does not affect portal. |
| FR-020a | Add to cart | Customer | Add available items; quantities and total | Cart `useState` in `src/routes/portal.tsx`. Lost on refresh. | **Partial** | UAT cart | UAT-CUS-006 | UI-only; not shared with staff queue. |
| FR-020b | Place / persist order | Customer | Submit a real order belonging to the Customer | Place order: `setCart({}); setPlaced(true)` in `portal.tsx`. No `Order` created; no create path in `endpoints`. | **Missing** | UAT create | UAT-CUS-007 | Do not treat the success message as order creation. |
| FR-021a | Pickup checkout | Customer | Explicit Pickup order type | No pickup field on `Order` (`src/lib/types.ts`). No checkout step. Channels include delivery brands (extended domain). | **Missing** | UAT checkout | UAT-CUS-007 | — |
| FR-022 | Cash/Card | Customer | Capture payment method | No payment fields in types or portal. | **Missing** | UAT checkout | UAT-CUS-007 | — |
| FR-024 / FR-025 | Confirmation + New | Customer | Confirm; order starts **New** | Banner “Order placed!” only. Status type is `Placed`, not `New`. No order id/reference created. | **Missing** | UAT confirmation + status | UAT-CUS-007 | Lifecycle mismatch: VAL-001. |
| FR-032 | Track status | Customer | See **current** status of **own** order | Portal “Order history” filters static `orders` by `user?.id`. New placements never appear. | **Partial** | UAT after real create + Staff update | UAT-CUS-008, UAT-E2E-001 | Cannot satisfy until create + shared store. |

---

## Staff

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-002 / FR-004 | Login + role | Staff | Staff access; Admin-only denied | Demo role tab `index.tsx`; `AppShell` `allow` + nav. Redirect if role not allowed. No server check in this repo. | **Partial** | Positive + negative UAT | UAT-STA-001, UAT-STA-002 | API RBAC **Requires Backend Verification**. |
| FR-030 | Order queue | Staff | View/filter orders | `src/routes/orders.tsx`: `useState(seedOrders)` from mock; search/status/channel filters. `getOrderQueue()` unused. | **Partial** | UAT queue filters | UAT-STA-003 | Not the Customer’s newly placed order. |
| FR-031 | Status updates | Staff | New→Confirmed→Preparing→ReadyForPickup→Completed; reject invalid | Flow in `orders.tsx`: `Placed`→`In kitchen`→`Ready`→`Completed`; Cancelled from non-terminal. Local state only. `updateOrderStatus` unused. | **Partial** | UAT transitions + negative | UAT-STA-004, UAT-STA-005 | Requirements names **absent** (VAL-001). UI does not enforce skip-ahead beyond hiding next button. |
| FR-014 | Item availability | Staff | Set available/unavailable; Customer sees it | Nav “Item Availability” → `/availability` — **no route**. Toggle on `/menu` (`allow` Admin+Staff) but Staff nav hides Menu Catalogue. `setAvailability()` unused. | **Partial** | UAT nav + toggle + portal | UAT-STA-006, UAT-STA-007 | DEF-006, DEF-007. |

---

## Administrator (`Admin`)

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-002 / FR-004 | Login + role | Administrator | Access admin functions; others denied | Same auth as Staff; nav Admin-only items. `allow` on pages. Client-only. | **Partial** | UAT Admin + Customer/Staff negative | UAT-ADM-001, UAT-ADM-006 | Live role claim **Requires Backend Verification**. |
| FR-013 | Menu CRUD | Administrator | Create / update / remove (or deactivate) items | `src/routes/menu.tsx`: add, stock +/−, availability toggle. **No** edit of name/price/description, **no** delete. Local `useState`. `saveMenuItem()` unused. | **Partial** | UAT CRUD + portal visibility | UAT-ADM-002 | Incomplete CRUD; no persistence. |
| FR-005 / FR-072 | User / role management | Administrator | View users; roles; activate/deactivate | Nav Users → `/users` — **no route file**. `getUsers` / `setUserActive` only in unused `data.ts`. | **Missing** | UAT when page exists | UAT-ADM-003 | DEF-005. |
| FR-070 | Essential reports | Administrator | Order/sales information (filterable) | `src/routes/dashboard.tsx`, `src/routes/reports.tsx` from mock; hardcoded KPI “New customers: 24”; CSV of `revenueByDay`. No date-range control. `getReport()` unused. | **Partial** | UAT reports vs live data | UAT-ADM-004 | Not authoritative sales. |
| FR-071 | Audit logs | Administrator | Logs of critical actions; read-only UI | `src/routes/audit-logs.tsx` renders static `auditLog` from mock. Menu/order actions do not append entries. `getAuditLog()` unused. | **Partial** | UAT after an admin action | UAT-ADM-005 | Display only. |

---

## Cross-cutting

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| NFR-SEC-02 | Authorization | All | Server/API enforces roles | `AppShell` `useEffect` redirect only (`src/components/AppShell.tsx`). Settings has no `allow`. | **Partial** | Negative UI + API 403 | UAT-STA-002, UAT-ADM-006 | UI hide ≠ authorization. API **Requires Backend Verification**. |
| NFR-REL-03 | Shared lifecycle | Customer + Staff | Same order, requirements statuses | Two copies of mock orders; statuses `Placed` / `In kitchen` / `Ready`. | **Missing** (shared New…Completed path) | UAT-E2E-001 | UAT-E2E-001 | VAL-001 + DEF-002. |
| INT-API | Live MVP data | All | Configured API drives auth, menu, orders, users, reports, audit | UI calls: login, `/health`, AI. `data.ts` unused by routes. | **Partial** | UAT-API-001; backend contract when API runs | UAT-API-001 | Login/health **Requires Backend Verification**. Do not Pass “live mode” from Settings badge. |

---

## End-to-end Must path (not executable as specified today)

Customer auth → menu → cart → Pickup + Cash/Card → order **New** → Staff queue → Confirmed → Preparing → ReadyForPickup → Customer track → Completed.

**Static conclusion:** blocked by Missing create/Pickup/payment, Partial mock queue, and VAL-001 status names. UAT-E2E-001 remains **Not Run** (expected Fail if executed now).

---

## Counts

| Implementation status | Rows |
|---|---|
| Implemented | 0 |
| Partial | 15 |
| Missing | 7 |
| Requires Backend Verification | Noted in Notes (login, RBAC, live login/health) — not used as the sole row status except where no frontend behaviour exists |
| Not Tested (execution) | **All** rows |

**22** requirement rows: Customer 10, Staff 4, Administrator 5, Cross-cutting 3.

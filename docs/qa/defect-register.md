# BruvHub QA Defect Register

**Source:** static repository inspection + architecture baseline (`docs/architecture/*`).  
**UAT execution:** none. Runtime Pass/Fail is not claimed here.

Classification:

| Class | Meaning |
|---|---|
| **A — DEF** | Confirmed implementation defect or gap (evidence in this repo; expected Must behaviour is clear) |
| **B — VAL** | Architecture/requirements mismatch needing team/consultant validation — **not** a confirmed software bug |
| **C — RBV** | Requires backend or runtime verification |

---

## 1. Severity

| Severity | Definition |
|---|---|
| Critical | Must MVP journey cannot be completed; severe security/data failure; app unusable |
| High | Major Must requirement fails; no reasonable workaround |
| Medium | Partial failure or significant usability/validation issue |
| Low | Cosmetic, branding, or low-impact consistency |

---

## 2. Status definitions

| Status | Meaning |
|---|---|
| Open | Confirmed and awaiting work (DEF) or awaiting decision (VAL/RBV) |
| Assigned | Owner allocated |
| In Progress | Fix or validation underway |
| Ready for Retest | Developer claims complete |
| Closed | Retest passed **or** VAL accepted/waived in writing |
| Reopened | Retest failed |

All items below are **Open**. None have been retested.

---

## 3. A — Confirmed implementation defects / gaps

| ID | Title | Area | Severity | Status | Evidence | Expected behaviour | Current behaviour | Requirement impact | Recommended next action |
|---|---|---|---|---|---|---|---|---|---|
| DEF-001 | Customer registration not implemented | Auth | High | Open | `endpoints.register` in `src/lib/api-client.ts`; no UI/call. Sign-in only: `src/routes/index.tsx`. | Customer can register then log in. | Register path unused. | FR-001 Missing | Frontend: register UI; backend: implement/verify `/api/auth/register`. |
| DEF-002 | Place order does not create an order | Customer / Orders | **Critical** | Open | `src/routes/portal.tsx`: `setCart({}); setPlaced(true)`. No `Order` append; no create endpoint in `endpoints`. | Persisted order, confirmation, status **New**. | Message only; cart cleared. | FR-020, FR-025, UAT-CUS-007/008, E2E | Add order-create contract + UI; wire shared store/API. |
| DEF-003 | Pickup checkout not implemented | Checkout | High | Open | `Order` in `src/lib/types.ts` has `channel`, no pickup type; `portal.tsx` has no checkout step. | Customer selects Pickup. | Place order skips checkout. | FR-021a | Add checkout + order-type field; keep delivery channels out of Must unless scoped. |
| DEF-004 | Cash/Card payment method not captured | Checkout | High | Open | No payment fields in `types.ts` or portal. | Capture Cash or Card (not a full gateway). | No payment step. | FR-022 | Add payment-method on order create. |
| DEF-005 | Users navigation has no route | Admin users | High | Open | `AppShell` link `/users`; no `src/routes/users*.tsx`; not in `routeTree.gen.ts`. `getUsers`/`setUserActive` unused in `data.ts`. | Administrator manages users/roles/active flag. | 404. | FR-005, FR-072, UAT-ADM-003 | Implement users page **or** remove nav until ready; wire `data.ts`. |
| DEF-006 | Staff Item Availability nav 404 | Staff availability | High | Open | `AppShell` Staff item → `/availability`; no route. Menu Catalogue nav is Admin-only; `menu.tsx` `allow` includes Staff. | Staff can change availability. | Primary Staff nav target 404s. | FR-014, UAT-STA-007 | Add route or point Staff nav at a working availability UI. |
| DEF-007 | Availability toggle does not affect Customer menu | Availability | High | Open | `menu.tsx` local `useState`; `portal.tsx` imports static `menuItems` from `mock-data.ts`. | Staff/Admin hide item → Customer cannot order it. | Two disconnected copies. | FR-012, FR-014, FR-026 | Single menu source (`data.ts` or API). |
| DEF-008 | MVP screens bypass `data.ts` / live API | Data / integration | High | Open | No route imports `src/lib/data.ts`. UI `apiRequest`: login, AI; Settings `fetch` `/health`. Orders/menu/reports/audit use mock/`useState`. | Configured API (or shared demo store) drives Must data. | Live badge can be true while Must data stays mock. | INT-API, README live mode, UAT-API-001 | Team: wire routes to `data.ts`; QA tests real source per screen. |
| DEF-009 | Demo login does not validate password | Auth | Medium | Open | `src/lib/auth.tsx` demo branch ignores password; `index.tsx` copy “any password works”. | Invalid credentials rejected (at least in live; demo should be labelled). | Any password + chosen role. | FR-002 | Keep demo labelled; live UAT-CUS-003 for real auth. Do not treat demo as credential proof. |
| DEF-010 | Authorization is client-side only in this repo | Security | High | Open | `AppShell` redirect on `allow`; Settings unauthenticated (`settings.tsx`). No server functions for domain ops. | Protected operations enforced at API/server. | UI gate only; role stored in `localStorage`. | NFR-SEC-02 | Backend must enforce; frontend gate remains UX. RBV-002 for API 403. |
| DEF-011 | Menu management is incomplete and non-persistent | Admin menu | High | Open | `menu.tsx`: add + stock + availability; no name/price edit, no delete; state lost on refresh. | Create/update/remove persist. | Partial local CRUD. | FR-013, UAT-ADM-002 | Complete UI + `saveMenuItem` / API. |
| DEF-012 | Reports and audit are static mock | Admin reports/audit | High | Open | `reports.tsx`/`dashboard.tsx` mock + hardcoded “New customers: 24”; `audit-logs.tsx` static `auditLog`; actions do not `logDemo` because `data.ts` unused. | Essential reports from real orders; audit of admin actions. | Display of seed data. | FR-070, FR-071 | Wire `getReport`/`getAuditLog`; write audit on mutations. |
| DEF-013 | No automated test framework | QA tooling | Medium | Open | `package.json` has no `test`; no `*.test.*`/`*.spec.*`; no CI tests. | Critical behaviour covered automatically over time. | Lint/build only. | Test strategy §12 | After team agreement: add runner; start with status/auth helpers — **do not add tests in this docs-only step**. |

---

## 4. B — Validation items (not confirmed software defects)

| ID | Title | Area | Severity (if treated as product later) | Status | Evidence | Expected (requirements) | Current (implementation) | Requirement impact | Recommended next action |
|---|---|---|---|---|---|---|---|---|---|
| VAL-001 | Order lifecycle naming/shape | Domain | — | Open | `OrderStatus` in `types.ts`; `flow` in `orders.tsx`. Requirements: New→Confirmed→Preparing→ReadyForPickup→Completed. | Requirements lifecycle (or approved map). | `Placed`→`In kitchen`→`Ready`→`Completed`. No Confirmed. | FR-025, FR-031, NFR-REL-03 | Agree mapping in `domain-contract.md` §5 **before** renaming code or failing UAT-STA-004 as a “wrong enum” bug. |
| VAL-002 | Administrator vs `Admin` | Domain | — | Open | `Role = "Admin" \| ...` in `types.ts`. | Requirements name Administrator. | `Admin`. | FR-004 | Keep mapping; do not rename solely for docs. Confirm live API returns `Admin`. |
| VAL-003 | Legacy StackedHub / Stacked Foods branding | Naming debt | Low if scoped | Open | UI “StackedHub”; emails `@stackedfoods.co.za`; keys `stackedhub.*`; package `tanstack_start_ts`. | BruvHub / Bruv Burger in requirements. | Legacy strings. | Traceability / demo polish | Cleanup when client requires; not a Must functional defect. |
| VAL-004 | README live API vs actual coverage | Docs vs code | — | Open | README live-mode section vs `api-contract.md` §4.1. | Live URL ⇒ live Must data. | Login/health/AI only from UI. | Tester confusion | Align README after DEF-008 decision; testers follow api-contract. |
| VAL-005 | Demo vs live as single data path | Architecture | — | Open | ADR-002; unused `data.ts`. | One authoritative path. | Dual architecture. | All Must data | Team decision before large refactors. |

---

## 5. C — Requires backend / runtime verification

| ID | Title | Area | Status | Evidence | What is known | What is not known | Recommended next action |
|---|---|---|---|---|---|---|---|
| RBV-001 | Live login + JWT | Auth | Open | `auth.tsx` `POST` `{ email, password }` → `{ token, user }` | Client contract documented | Credential store, `user.role` values, token expiry | Run UAT-CUS-003 / UAT-API-001 against real API |
| RBV-002 | API authorization (401/403) | Security | Open | `apiRequest` maps 401/403 | Frontend error strings | Whether endpoints actually authorize | Negative API tests with wrong-role token |
| RBV-003 | Staff/admin REST resources | Integration | Open | `data.ts` methods unused by UI | Intended paths/methods in api-contract | Backend existence, DTO match, `OrderStatus` strings | Backend review + contract test after DEF-008 |
| RBV-004 | `/health` and API host | Ops | Open | `settings.tsx`; README `:5000` vs placeholder `:5032` | Frontend probe | Correct port, auth on health | Confirm with backend owner |
| RBV-005 | Register / forgot-password / customers / promotions APIs | Extra/unused | Open | `endpoints` unused | Paths declared | Any backend behaviour | Out of Must except register (DEF-001) |

---

## 6. Summary counts

| Class | Open | Notes |
|---|---:|---|
| **DEF (A)** | **13** | Including 1 Critical (DEF-002) |
| **VAL (B)** | **5** | Do not fix as “bugs” without a decision |
| **RBV (C)** | **5** | Blocked on backend/runtime |
| UAT executed | **0** | |

| DEF severity | Open |
|---|---:|
| Critical | 1 |
| High | 10 |
| Medium | 2 |
| Low | 0 |

---

## 7. Biggest QA risks (for Task 2)

1. **Customer Must path cannot succeed** until order create, Pickup, and payment exist (DEF-002–004).
2. **Staff/Customer state is not shared** (mock copies) — E2E tracking will fail even if UIs look finished.
3. **Live API UAT will mislead** until routes use `data.ts` (DEF-008) and VAL-001 statuses match the backend.
4. **Admin user management is a 404** (DEF-005); audit/reports are seed data (DEF-012).
5. **No automated safety net** (DEF-013) while the above gaps remain.

Testers: log UAT Fail against DEF/VAL/RBV IDs; do not open duplicate defects for the same evidence without new runtime information.

# BruvHub QA Defect Register

**Source:** Pre-merge static baseline, then **post-merge re-audit** (frontend + `backend/StackedHub.*`).  
**UAT execution (2026-09-29 live):** Staff queue + implemented lifecycle on `:5032` / frontend `:8080`. `dotnet test` is **not** a UAT Pass by itself.

Classification: **DEF** = implementation gap; **VAL** = requirements/architecture reconciliation (not an automatic code bug); **RBV** = runtime/backend verification remaining.

**Re-audit classes for DEF-001–013:** Still Present | Partially Resolved | Resolved (404/tooling as specified). IDs and original severities preserved.

---

## 1. Severity

| Severity | Definition |
|---|---|
| Critical | Must journey cannot complete; severe security/data failure |
| High | Major Must fails; no reasonable workaround |
| Medium | Partial failure or significant usability/validation issue |
| Low | Cosmetic / branding / low impact |

---

## 2. Status definitions

Open → Assigned → In Progress → Ready for Retest → Closed. Failed retest → Reopened.

**Partially Resolved** = merge improved code; Must gap or retest still outstanding. Not Closed without UAT where behaviour is user-facing.

---

## 3. A — DEF-001 through DEF-013

| ID | Title | Area | Severity | Re-audit class | Status | Original finding (pre-merge) | Current behaviour (post-merge) | Requirement impact | Recommended next action |
|---|---|---|---|---|---|---|---|---|---|
| DEF-001 | Customer registration not implemented | Auth | High | **Still Present** | Open | No UI; `endpoints.register` unused | API `POST /api/auth/register` exists. **No register UI/call.** | FR-001 Missing | Frontend register form calling API. |
| DEF-002 | Place order does not create an order | Orders | **Critical** | **Still Present** (UI). API implemented. | Open | `setCart({}); setPlaced(true)` | Unchanged portal. Backend `POST /api/orders` **not** in `endpoints`. | FR-020, FR-025, E2E | Wire portal to place-order API. |
| DEF-003 | Pickup checkout not implemented | Checkout | High | **Still Present** (UI) | Open | No pickup field/checkout | No checkout UI. Backend `PlacePickupAsync` unused by UI. | FR-021a | Checkout UI; keep delivery channels non-Must. |
| DEF-004 | Cash/Card not captured | Checkout | High | **Still Present** (UI) | Open | No payment fields | No UI. API requires Cash/Card; **OrderDto omits payment** (DEF-015). | FR-022 | Capture on place; expose on DTO if tracking needs it. |
| DEF-005 | Users nav 404 | Admin users | High | **Resolved** (route). Residual DEF-014. | Open (residual) | No `users.tsx` | `/users` + `getUsers` / `setUserActive`. No role change. Live `active: true` overwrite. | FR-005 Partial | UAT-ADM-003; fix DEF-014. Close 404 portion after UAT of page load. |
| DEF-006 | Availability nav 404 | Staff | High | **Resolved** (route) | Open pending UAT | No `/availability` | `availability.tsx` + `setAvailability`. | FR-014 | UAT-STA-007; keep DEF-007 for Customer sync. |
| DEF-007 | Availability ≠ Customer menu | Availability | High | **Still Present** | Open | Separate `useState` vs mock | Staff/Admin use `data.ts`; **portal still `mock-data`**. | FR-012, FR-014, FR-026 | Portal `getMenu`. |
| DEF-008 | MVP screens bypass `data.ts` | Integration | High | **Partially Resolved** | Open | No route imported `data.ts` | Staff/Admin Must **use** `data.ts`/`use-load`. **Portal (Must) does not.** CRM/promotions still mock. | INT-API | Finish Customer path. |
| DEF-009 | Demo login ignores password | Auth | Medium | **Still Present** (demo) | Open | Any password | Unchanged demo. Live BCrypt login exists; UAT-CUS-003 Not Run. | FR-002 | Label demo; live UAT for real auth. |
| DEF-010 | AuthZ client-only | Security | High | **Partially Resolved** | Open | No server in repo | `AppShell` still client. **API `[Authorize]` + 403 tests.** Browser UAT Not Run. | NFR-SEC-02 | Negative UAT; Staff vs admin API. |
| DEF-011 | Menu CRUD incomplete | Admin menu | High | **Partially Resolved** | Open | Add/stock only; local state | Create+**edit** via `saveMenuItem`. No DELETE. Portal isolated. | FR-013 | DELETE or explicit deactivate-only; portal `getMenu`. |
| DEF-012 | Reports/audit static mock | Admin | High | **Partially Resolved** | Open | Static arrays | `getReport`/`getAuditLog` wired. Live `ReportService`/audit. Demo reports still mix mock series. | FR-070, FR-071 | Live UAT; demo honesty. |
| DEF-013 | No automated tests | QA tooling | Medium | **Partially Resolved** | Open | No tests in repo | **Backend** `ApiFlowTests` + `OrderLifecycleTests`. **Frontend/CI still none.** | Strategy §12 | Keep `dotnet test`; add FE/CI later. |

---

## 4. B — VAL-001 through VAL-005

| ID | Title | Re-audit | Status | Notes |
|---|---|---|---|---|
| VAL-001 | Order lifecycle naming | **Open — do not treat as equivalent** | Open | FE+BE share `Placed→In kitchen→Ready→Completed`. Requirements still New→Confirmed→Preparing→ReadyForPickup. **No Confirmed.** Successful 2026-09-29 runtime of the **implemented** chain does **not** close this. Needs consultant/team **acceptance**. |
| VAL-002 | Administrator vs `Admin` | **Accepted mapping** | Closed (mapping accepted; **no code rename**) | JWT and UI use `Admin`. Documents say Administrator (`Admin`). |
| VAL-003 | StackedHub branding | Unchanged | Open | Debt, not Must defect. |
| VAL-004 | README live mode vs coverage | **Partial** | Open | Staff/Admin can be live; **Customer Must still mock.** README **:5000** vs API **:5032**. |
| VAL-005 | Single data path | **Partial** | Open | `data.ts` used for Staff/Admin. **Portal still bypasses.** |

---

## 5. C — RBV-001 through RBV-005

| ID | Title | Re-audit | Status | Known now | Remaining |
|---|---|---|---|---|---|
| RBV-001 | Live login + JWT | **Partially Resolved** | Open | BCrypt, 12h JWT, `{ token, user }`, seed `Stacked123!`. Staff **Jason Reid** signed in via live frontend `:8080` → API `:5032`. | **Browser** UAT-CUS-003 / UAT-API-001 (Settings smoke) still Not Run. UAT-STA-001 not separately signed off. |
| RBV-002 | API 401/403 | **Partially Resolved** | Open | Customer 403 on staff/CRM/reports tested. | Staff→Admin routes; frontend error UX. |
| RBV-003 | Staff/admin REST | **Partially Resolved** | Open | Controllers exist; **`data.ts` calls them**. Live Staff queue + status PATCH verified after DEF-017. | Customer `POST /api/orders` unwired; DEF-014 mapping. |
| RBV-004 | `/health` and host | Health **verified on :5032**; port docs **open** | Open | Live `GET /health` returned `{ status: "ok" }`. Listen **5032**. | README **5000** vs 5032; UAT-API-001 Settings flow Not Run. |
| RBV-005 | Register/forgot/CRM/promotions APIs | **Partially Resolved** (API) | Open | Register + customers + promotions APIs exist. Forgot-password **stub**. | Register **UI** (DEF-001); CRM/promotions pages still mock. |

---

## 6. Post-merge additional findings

| ID | Title | Area | Severity | Status | Evidence | Expected | Current | Next |
|---|---|---|---|---|---|---|---|---|
| DEF-014 | Live `getUsers` forces `active: true` | Users | High | Open | `data.ts` `users.map((u) => ({ ...u, active: true }))` | Show `AuthUserDto.Active` | Deactivated users can appear Active until toggled | Frontend: map API `active`; do not overwrite |
| DEF-015 | Payment not on `OrderDto` | Contract | Medium | Open | `ApiContracts.OrderDto`; `PlaceOrderRequest.PaymentMethod` | Tracking/reports can show Cash/Card if required | Stored on entity; omitted from DTO | Backend teammate if Must tracking needs it |
| DEF-016 | No menu DELETE | Menu | Medium | Open | No DELETE in controllers/`data.ts` | FR-013 remove/deactivate | Create/update only | Policy: DELETE vs available=false |
| DEF-017 | Staff Accept JSON enum binding (`"In kitchen"`) | Staff / integration | **High** | **Resolved / Verified** (Closed) | **Original Fail:** Jason Reid, live `:5032`/`:8080`, Accept on `#4808` Placed. UI: “One or more validation errors occurred.” Order stayed Placed. No UPDATE SQL. Body `{ "status": "In kitchen" }` to `PATCH /api/staff/orders/{id}/status`. `JsonStringEnumConverter` registered before `OrderStatusJsonConverter`. Tests had sent `"InKitchen"` to `/api/orders/{id}/status`. **Fix:** specific converters registered first; `Staff_status_patch_accepts_frontend_in_kitchen_wire_value` (literal `{"status":"In kitchen"}`). Suite **18/18**. **Manual retest (API restarted):** `#4808` still Placed; Accept → **In kitchen**; full reload; remained In kitchen (Mark ready). Persistence verified. | Accept persists next kitchen state (`InKitchen` / wire `"In kitchen"`). | Retest matched expected Staff Accept persist. | None for this bind defect. **Not VAL-001.** |

Other risks (not separate DEFs unless they bite UAT): forgot-password stub; CORS `AllowAnyOrigin`; no frontend/CI tests (DEF-013); Customer live/mock split (DEF-007/008).

**Environment observation (not a product DEF):** running backend integration tests against the same development database added orders to the Staff queue (visible count **9 → 13**). Test-data contamination / isolation issue for live UAT, not a functional failure of queue or lifecycle.

---

## 7. Summary counts

| Class | Count | Notes |
|---|---|---|
| DEF-001–013 Still Present | **6** | 001, 002, 003, 004, 007, 009 |
| DEF-001–013 Partially Resolved | **5** | 008, 010, 011, 012, 013 |
| DEF-001–013 Resolved (as originally scoped) | **2** | 005 404, 006 404 — residual/UAT remain |
| New DEF-014–016 | **3** | Open |
| DEF-017 Staff Accept JSON bind | **1** | **Resolved / Verified** (Closed after automated 18/18 + manual retest) |
| VAL open | **4** | 001, 003, 004, 005 — **VAL-001 unchanged / still Open** |
| VAL closed (mapping) | **1** | 002 |
| RBV still open (partial progress) | **5** | Health + Staff live login/queue/status now have runtime notes |
| UAT executed | **3 recorded (current)** | STA-003 **Pass**; STA-004 **Pass (retest)** / original **Fail** retained; E2E-001 **Blocked** (DEF-002) |

DEF-001–013 open user-facing work: treat **Still Present + Partially Resolved** as not Closed (**11** still active in that set, plus 005/006 pending UAT confirmation).

| DEF-001–013 severity still relevant | |
|---|---|
| Critical open | DEF-002 (product UI) |
| High | Majority of remaining Must gaps |
| Medium | DEF-009, DEF-013, DEF-015, DEF-016 |

---

## 8. Biggest QA risks (post-merge)

1. **Customer Must still fake-places orders** while Staff looks live (DEF-002–004, 007, 008).
2. **VAL-001** — remains **Open**. Implemented-lifecycle Pass does not equal New→Confirmed→Preparing→ReadyForPickup. Do not Pass E2E on requirements status **names**.
3. **Port 5032 vs README 5000** — false negatives on UAT-API-001.
4. **DEF-014** — users page lies about `active` in live mode.
5. **Test-data isolation** — `dotnet test` against the shared dev DB inflated the Staff queue (9 → 13). Not a product defect.

Testers: attach Fail to existing IDs; add runtime notes rather than duplicate DEFs.

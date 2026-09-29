# BruvHub QA Defect Register

**Source:** Pre-merge static baseline, then **post-merge re-audit** (frontend + `backend/StackedHub.*`).  
**UAT execution (through 2026-09-30 live):** Staff queue + implemented lifecycle + Item Availability; Admin screens used with notes (not Pass unless case fully met). `dotnet test` is **not** a UAT Pass by itself. `--list-tests` is discovery only.

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
| DEF-005 | Users nav 404 | Admin users | High | **Resolved** (route + live page load). Residual DEF-014. | Open (residual DEF-014) | No `users.tsx` | `/users` + `getUsers` / `setUserActive`. Day 2: Admin Users loaded **8** accounts (Admin/Customer/Staff). No role change. Live `active: true` overwrite **not** trusted. | FR-005 Partial | Fix DEF-014. Do not Pass UAT-ADM-003 (toggle/login impact not run). |
| DEF-006 | Availability nav 404 | Staff | High | **Resolved** (route + UAT-STA-007) | **Closed** (404 scope) | No `/availability` | Live `/availability` loaded 10 items; Onion Rings toggle persisted after Ctrl+R. | FR-014 Partial | Keep **DEF-007** for Customer portal sync. |
| DEF-007 | Availability ≠ Customer menu | Availability | High | **Still Present** | Open | Separate `useState` vs mock | Staff/Admin persist verified Day 2 (Onion Rings Sold out on Staff + Admin dashboard/menu). **Portal still `mock-data`; Customer behaviour not tested.** | FR-012, FR-014, FR-026 | Portal `getMenu`. UAT-STA-006 remains Not Run. |
| DEF-008 | MVP screens bypass `data.ts` | Integration | High | **Partially Resolved** | Open | No route imported `data.ts` | Staff/Admin Must **use** `data.ts`/`use-load`. **Portal (Must) does not.** CRM/promotions still mock. | INT-API | Finish Customer path. |
| DEF-009 | Demo login ignores password | Auth | Medium | **Still Present** (demo) | Open | Any password | Unchanged demo. Live BCrypt login exists; UAT-CUS-003 Not Run. | FR-002 | Label demo; live UAT for real auth. |
| DEF-010 | AuthZ client-only | Security | High | **Partially Resolved** | Open | No server in repo | `AppShell` still client. **API `[Authorize]` + 403 tests.** Day 2: unauthenticated `GET /api/admin/users` → **HTTP 401**. Do not infer Staff/Customer UI denial or role 403 from this alone. | NFR-SEC-02 | UAT-STA-002 / UAT-ADM-006 / UAT-CUS-009 still Not Run. |
| DEF-011 | Menu CRUD incomplete | Admin menu | High | **Partially Resolved** | Open | Add/stock only; local state | Create+**edit** via `saveMenuItem`. Day 2: Malva Pudding stock 12→13 persisted after refresh; restored 13→12. **No DELETE.** Portal isolated. | FR-013 | DELETE or explicit deactivate-only; portal `getMenu`. UAT-ADM-002 remains Not Run. |
| DEF-012 | Reports/audit static mock | Admin | High | **Partially Resolved** | Open | Static arrays | `getReport`/`getAuditLog` wired. Day 2: live Reports showed populated order count, completed sales, revenue by day, best sellers, sales by channel (**totals not independently verified**). Audit Logs showed **12** entries including **Thandi Mokoena updated menu item — Malva Pudding**. Demo reports may still mix mock series. | FR-070, FR-071 | UAT-ADM-004/005 remain Not Run (full expected results not met). |
| DEF-013 | No automated tests | QA tooling | Medium | **Partially Resolved** | Open | No tests in repo | **Backend** `ApiFlowTests` + `OrderLifecycleTests`. Latest full execution after Onion Rings restore: **18/18**. **Frontend/CI still none.** | Strategy §12 | Keep `dotnet test`; isolate from LocalDB; add FE/CI later. |

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
| RBV-001 | Live login + JWT | **Partially Resolved** | Open | BCrypt, 12h JWT, `{ token, user }`, seed `Stacked123!`. Staff **Jason Reid** and Admin **Thandi Mokoena** signed in via live frontend `:8080` → API `:5032`. | **Browser** UAT-CUS-003 / UAT-API-001 (Settings smoke) still Not Run. UAT-STA-001 / UAT-ADM-001 not separately Passed. |
| RBV-002 | API 401/403 | **Partially Resolved** | Open | Customer 403 on staff/CRM/reports in `ApiFlowTests`. Day 2 manual: **no JWT** `GET /api/admin/users` → **401 Unauthorized**. | Staff→Admin as authenticated Staff; frontend error UX; UAT-STA-002 / UAT-ADM-006 Not Run. Do not claim broader AuthZ from the 401 alone. |
| RBV-003 | Staff/admin REST | **Partially Resolved** | Open | Live Staff queue, status PATCH (DEF-017), availability persist; Admin menu stock edit, users list, populated reports, audit row for Malva Pudding. | Customer `POST /api/orders` unwired; DEF-014 mapping. |
| RBV-004 | `/health` and host | Health **verified on :5032**; port docs **open** | Open | Live `GET /health` returned `{ status: "ok" }`. Listen **5032**. Day 2: live API indicator visible in browser. | README **5000** vs 5032; UAT-API-001 Settings flow Not Run. |
| RBV-005 | Register/forgot/CRM/promotions APIs | **Partially Resolved** (API) | Open | Register + customers + promotions APIs exist. Forgot-password **stub**. | Register **UI** (DEF-001); CRM/promotions pages still mock. |

---

## 6. Post-merge additional findings

| ID | Title | Area | Severity | Status | Evidence | Expected | Current | Next |
|---|---|---|---|---|---|---|---|---|
| DEF-014 | Live `getUsers` forces `active: true` | Users | High | Open | `data.ts` `users.map((u) => ({ ...u, active: true }))`. Day 2: Users list loaded (8 rows) but **Active column not treated as backend truth**. | Show `AuthUserDto.Active` | Deactivated users can appear Active until toggled | Frontend: map API `active`; do not overwrite |
| DEF-015 | Payment not on `OrderDto` | Contract | Medium | Open | `ApiContracts.OrderDto`; `PlaceOrderRequest.PaymentMethod` | Tracking/reports can show Cash/Card if required | Stored on entity; omitted from DTO | Backend teammate if Must tracking needs it |
| DEF-016 | No menu DELETE | Menu | Medium | Open | No DELETE in controllers/`data.ts` | FR-013 remove/deactivate | Create/update only | Policy: DELETE vs available=false |
| DEF-017 | Staff Accept JSON enum binding (`"In kitchen"`) | Staff / integration | **High** | **Resolved / Verified** (Closed) | **Original Fail:** Jason Reid, live `:5032`/`:8080`, Accept on `#4808` Placed. UI: “One or more validation errors occurred.” Order stayed Placed. No UPDATE SQL. Body `{ "status": "In kitchen" }` to `PATCH /api/staff/orders/{id}/status`. `JsonStringEnumConverter` registered before `OrderStatusJsonConverter`. Tests had sent `"InKitchen"` to `/api/orders/{id}/status`. **Fix:** specific converters registered first; `Staff_status_patch_accepts_frontend_in_kitchen_wire_value` (literal `{"status":"In kitchen"}`). Suite **18/18**. **Manual retest (API restarted):** `#4808` still Placed; Accept → **In kitchen**; full reload; remained In kitchen (Mark ready). Persistence verified. | Accept persists next kitchen state (`InKitchen` / wire `"In kitchen"`). | Retest matched expected Staff Accept persist. | None for this bind defect. **Not VAL-001.** |

Other risks (not separate DEFs unless they bite UAT): forgot-password stub; CORS `AllowAnyOrigin`; no frontend/CI tests (DEF-013); Customer live/mock split (DEF-007/008).

**Environment observation (not a product DEF):** backend `ApiFlowTests` are **not isolated** from the shared LocalDB (`StackedHub` on `(localdb)\\mssqllocaldb`). Suite runs mutate menu stock and inflate the Staff queue (observed **9 → 13**). After Day 2 UAT left Onion Rings **Sold out**, a full `dotnet test StackedHub.sln` was **17 passed / 1 failed / 0 skipped**: `Customer_checkout_can_set_channel` POSTed Onion Rings and got HTTP 400 (`Available=false`). Read-only investigation: shared-DB contamination, **not** a product-code regression, **not** unmerged `origin/main`. Onion Rings was restored to **Available** (UAT test-data restore; no product-code change). Subsequent full run: **18 passed / 0 failed / 0 skipped**. Isolation defect remains.

---

## 7. Summary counts

| Class | Count | Notes |
|---|---|---|
| DEF-001–013 Still Present | **6** | 001, 002, 003, 004, 007, 009 |
| DEF-001–013 Partially Resolved | **5** | 008, 010, 011, 012, 013 |
| DEF-001–013 Resolved (as originally scoped) | **2** | 005 404 (page loaded Day 2); **006 404 Closed** after UAT-STA-007 — residuals DEF-014 / DEF-007 |
| New DEF-014–016 | **3** | Open |
| DEF-017 Staff Accept JSON bind | **1** | **Resolved / Verified** (unchanged) |
| VAL open | **4** | 001, 003, 004, 005 — **VAL-001 unchanged / still Open** |
| VAL closed (mapping) | **1** | 002 |
| RBV still open (partial progress) | **5** | Day 2: 401 on `/api/admin/users`; Admin/Staff live screens noted |
| UAT executed | **4 recorded (current)** | STA-003 **Pass**; STA-004 **Pass (retest)** / original **Fail** retained; STA-007 **Pass**; E2E-001 **Blocked** (DEF-002) |

DEF-001–013 open user-facing work: treat **Still Present + Partially Resolved** as not Closed (**11** still active in that set, plus 005 residual DEF-014). DEF-006 404 is Closed; Customer availability remains DEF-007.

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
5. **Test-data isolation** — `ApiFlowTests` hit shared LocalDB. Queue 9 → 13; Day 2 Onion Rings Sold out caused a transient **17/18** (`Customer_checkout_can_set_channel`). Restored Available → **18/18**. Not a product defect. Do not treat 18/18 as UAT Pass.

Testers: attach Fail to existing IDs; add runtime notes rather than duplicate DEFs.

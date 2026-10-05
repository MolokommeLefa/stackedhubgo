# BruvHub QA Defect Register

**Source:** Pre-merge static baseline, then **post-merge re-audit**, Day 2 Staff/Admin UAT (2026-09-29/30), Day 3 Customer E2E + Staff dashboard (2026-10-01).
**UAT execution:** live `:5032` / `:8080`. `dotnet test` / GitHub Actions CI are **not** UAT Pass by themselves.

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
| DEF-002 | Place order does not create an order | Orders | **Critical** | **Resolved** (persist). Residual checkout DEF-003/004. | **Resolved / Verified** (persist) | `setCart({}); setPlaced(true)` | **Original:** portal banner only; `POST /api/orders` unused. **Day 3:** Priya Nair, live portal, **#4829** Homemade Lemonade **R32**; queue **24 → 25**; status **Placed**. Jason Reid saw the same order. **Pickup / Cash/Card UI still absent.** | FR-020 persist met; FR-021a/022 still Missing | Keep DEF-003, DEF-004, DEF-015. VAL-001 Open. |
| DEF-003 | Pickup checkout not implemented | Checkout | High | **Still Present** (UI) | Open | No pickup field/checkout | Day 3: Customer placed **#4829** without explicit Pickup control. Backend can capture pickup; UI still does not expose it. | FR-021a | Checkout Pickup control. |
| DEF-004 | Cash/Card not captured | Checkout | High | **Still Present** (UI) | Open | No payment fields | Day 3: no Cash/Card selection on Customer checkout. API may still require a method; **OrderDto omits payment** (DEF-015). | FR-022 | Capture on place; expose on DTO if tracking needs it. |
| DEF-005 | Users nav 404 | Admin users | High | **Resolved** (route + live page load). Residual DEF-014. | Open (residual DEF-014) | No `users.tsx` | `/users` + `getUsers` / `setUserActive`. Day 2: Admin Users loaded **8** accounts (Admin/Customer/Staff). No role change. Live `active: true` overwrite **not** trusted. | FR-005 Partial | Fix DEF-014. Do not Pass UAT-ADM-003 (toggle/login impact not run). |
| DEF-006 | Availability nav 404 | Staff | High | **Resolved** (route + UAT-STA-007) | **Closed** (404 scope) | No `/availability` | Live `/availability` loaded 10 items; Onion Rings toggle persisted after Ctrl+R. | FR-014 Partial | Keep **DEF-007** for Customer portal sync. |
| DEF-007 | Availability ≠ Customer menu | Availability | High | **Still Present** | Open | Separate `useState` vs mock | Staff/Admin persist verified Day 2 (Onion Rings Sold out on Staff + Admin dashboard/menu). **Customer menu sync still not UAT-verified** (UAT-STA-006 Not Run). Day 3 order **#4829** used Homemade Lemonade (available item). | FR-012, FR-014, FR-026 | Portal `getMenu`. UAT-STA-006 remains Not Run. |
| DEF-008 | MVP screens bypass `data.ts` | Integration | High | **Partially Resolved** | Open | No route imported `data.ts` | Staff/Admin Must use `data.ts`. **Day 3:** live portal persisted **#4829** and tracked Staff status updates. CRM/promotions may still be mock. Checkout Pickup/Cash/Card still missing. | INT-API | DEF-003/004; VAL-001. |
| DEF-009 | Demo login ignores password | Auth | Medium | **Still Present** (demo) | Open | Any password | Unchanged demo. Live BCrypt login exists; UAT-CUS-003 Not Run. Day 3 live portal used Priya Nair (not a demo-login verdict). | FR-002 | Label demo; live UAT for real auth. |
| DEF-010 | AuthZ client-only | Security | High | **Partially Resolved** | Open | No server in repo | API `[Authorize]`. Day 2: no JWT `GET /api/admin/users` → **401**. Day 3: Staff dashboard **403** on Admin reports (DEF-018, Resolved). UAT-STA-002 / UAT-ADM-006 still Not Run. | NFR-SEC-02 | Negative UI UAT remaining. |
| DEF-011 | Menu CRUD incomplete | Admin menu | High | **Partially Resolved** | Open | Add/stock only; local state | Create+**edit** via `saveMenuItem`. Day 2: Malva Pudding stock 12→13 persisted after refresh; restored 13→12. **No DELETE.** Portal isolated. | FR-013 | DELETE or explicit deactivate-only; portal `getMenu`. UAT-ADM-002 remains Not Run. |
| DEF-012 | Reports/audit static mock | Admin | High | **Partially Resolved** | Open | Static arrays | `getReport`/`getAuditLog` wired. Day 2: live Reports showed populated order count, completed sales, revenue by day, best sellers, sales by channel (**totals not independently verified**). Audit Logs showed **12** entries including **Thandi Mokoena updated menu item — Malva Pudding**. Demo reports may still mix mock series. | FR-070, FR-071 | UAT-ADM-004/005 remain Not Run (full expected results not met). |
| DEF-013 | No automated tests | QA tooling | Medium | **Partially Resolved** | Open | No tests in repo | Backend `ApiFlowTests` + `OrderLifecycleTests` (**18/18** local after isolation restore). **Day 3:** GitHub Actions CI on `feature/system-architecture-qa` — backend job **Pass**, frontend production build **Pass** (also after DEF-018 dashboard fix). No frontend unit runner. | Strategy §12 | Keep CI; isolate LocalDB; FE unit tests still absent. |

---

## 4. B — VAL-001 through VAL-005

| ID | Title | Re-audit | Status | Notes |
|---|---|---|---|---|
| VAL-001 | Order lifecycle naming | **Open — do not treat as equivalent** | Open | FE+BE share `Placed→In kitchen→Ready→Completed`. Requirements still New→Confirmed→Preparing→ReadyForPickup. **No Confirmed.** Day 2 Staff runtime and Day 3 Customer↔Staff **#4829** verified the **implemented** chain only. Do **not** claim the requirements naming mismatch is resolved. Needs consultant/team **acceptance**. |
| VAL-002 | Administrator vs `Admin` | **Accepted mapping** | Closed (mapping accepted; **no code rename**) | JWT and UI use `Admin`. Documents say Administrator (`Admin`). |
| VAL-003 | StackedHub branding | Unchanged | Open | Debt, not Must defect. |
| VAL-004 | README live mode vs coverage | **Partial** | Open | Staff/Admin live previously. **Day 3:** Customer Portal also live-placed **#4829**. README **:5000** vs API **:5032** still open. |
| VAL-005 | Single data path | **Partial** | Open | Staff/Admin `data.ts`. **Day 3:** Customer place/track for **#4829** used the live API/database (Staff queue saw the same order). CRM/promotions may still be mock. |

---

## 5. C — RBV-001 through RBV-005

| ID | Title | Re-audit | Status | Known now | Remaining |
|---|---|---|---|---|---|
| RBV-001 | Live login + JWT | **Partially Resolved** | Open | BCrypt, 12h JWT, `{ token, user }`, seed `Stacked123!`. Staff **Jason Reid**, Admin **Thandi Mokoena**, Day 3 Customer **Priya Nair** used the live frontend `:8080` → API `:5032`. | **Browser** UAT-CUS-003 / UAT-API-001 (Settings smoke) still Not Run. UAT-ADM-001 not separately Passed. |
| RBV-002 | API 401/403 | **Partially Resolved** | Open | Customer 403 on staff/CRM/reports in `ApiFlowTests`. Day 2: no JWT `GET /api/admin/users` → **401**. Day 3: Staff `/dashboard` **403** from Admin-only reports (DEF-018, frontend fix; backend reports still Admin-only). | UAT-STA-002 / UAT-ADM-006 Not Run. Do not claim broader AuthZ from these alone. |
| RBV-003 | Staff/admin REST | **Partially Resolved** | Open | Live Staff queue, status PATCH (DEF-017), availability persist; Admin menu stock edit, users list, populated reports, audit row for Malva Pudding. **Day 3:** Customer **#4829** created via live portal; Staff queue showed the same order; Staff dashboard retest after DEF-018. | DEF-014 mapping; Pickup/Cash/Card UI. |
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
| DEF-018 | Staff `/dashboard` 403 from Admin-only reports | Staff / AuthZ UX | **High** | **Resolved / Verified** (Closed) | **Original Fail (Day 3):** Jason Reid, live Staff `/dashboard`. UI access error derived from **HTTP 403**. Staff routing/authentication were valid. Shared Staff/Admin `dashboard.tsx` treated `getReport()` as mandatory; `GET /api/reports` (and `/api/admin/reports`) is **intentionally Admin-only**. `Promise.all` failed the whole load. **Fix (frontend only):** request `getReport()` only when `user.role === "Admin"`; Staff still loads `getOrderQueue()` + `getMenu()`. Backend report authorization **not** weakened. Production frontend build **Pass** after the fix. **Manual retest:** Jason Reid, `/dashboard` loaded successfully with live order/menu data and **no** access error. | Staff dashboard loads orders/menu without calling Admin-only reports. | Retest matched expected Staff dashboard load. | None for this defect. Do not Pass UAT-STA-002 / UAT-ADM-006 from this. |

Other risks (not separate DEFs unless they bite UAT): forgot-password stub; CORS `AllowAnyOrigin`; no frontend unit tests (DEF-013; GitHub Actions CI now present); Customer checkout Pickup/Cash/Card UI (DEF-003/004); VAL-001 lifecycle names.

**Environment observation (not a product DEF):** backend `ApiFlowTests` are **not isolated** from the shared LocalDB (`StackedHub` on `(localdb)\\mssqllocaldb`). Suite runs mutate menu stock and inflate the Staff queue (observed **9 → 13**). After Day 2 UAT left Onion Rings **Sold out**, a full `dotnet test StackedHub.sln` was **17 passed / 1 failed / 0 skipped**: `Customer_checkout_can_set_channel` POSTed Onion Rings and got HTTP 400 (`Available=false`). Read-only investigation: shared-DB contamination, **not** a product-code regression, **not** unmerged `origin/main`. Onion Rings was restored to **Available** (UAT test-data restore; no product-code change). Subsequent full run: **18 passed / 0 failed / 0 skipped**. Isolation defect remains.

---

## 7. Summary counts

| Class | Count | Notes |
|---|---|---|
| DEF-001–013 Still Present | **5** | 001, 003, 004, 007, 009 |
| DEF-001–013 Partially Resolved | **5** | 008, 010, 011, 012, 013 |
| DEF-001–013 Resolved (as originally scoped) | **3** | **002 persist** Day 3 `#4829`; 005 404 (page loaded Day 2); **006 404 Closed** after UAT-STA-007 — residuals DEF-003/004, DEF-014, DEF-007 |
| New DEF-014–016 | **3** | Open |
| DEF-017 Staff Accept JSON bind | **1** | **Resolved / Verified** (unchanged) |
| DEF-018 Staff dashboard 403 | **1** | **Resolved / Verified** (Day 3; original Fail + retest retained) |
| VAL open | **4** | 001, 003, 004, 005 — **VAL-001 still Open** (implemented names ≠ requirements names) |
| VAL closed (mapping) | **1** | 002 |
| RBV still open (partial progress) | **5** | Day 3: live Customer **#4829**; Staff dashboard retest after DEF-018 |
| UAT executed (current verdicts) | **7 recorded** | Pass **5** (CUS-008, STA-001 retest, STA-003, STA-004 retest, STA-007); Blocked **2** (CUS-007, E2E-001) |

DEF-001–013 open user-facing work: treat **Still Present + Partially Resolved** as not Closed (**10** still active in that set, plus 005 residual DEF-014). DEF-002 persist is Resolved / Verified; checkout gaps remain DEF-003/004. DEF-006 404 is Closed; Customer availability remains DEF-007.

| DEF-001–013 severity still relevant | |
|---|---|
| Critical open | **None** (DEF-002 persist closed; checkout High remains) |
| High | Remaining Must gaps (register, Pickup/Cash/Card UI, availability vs Customer, AuthZ UI UAT) |
| Medium | DEF-009, DEF-013, DEF-015, DEF-016 |

---

## 8. Biggest QA risks (post-merge)

1. **Customer checkout still has no explicit Pickup or Cash/Card controls** (DEF-003, DEF-004, DEF-015). Persist of **#4829** does not close those Musts.
2. **VAL-001** — remains **Open**. Implemented-lifecycle Pass (`Placed→In kitchen→Ready→Completed` on **#4829**) does not equal New→Confirmed→Preparing→ReadyForPickup. Do not Pass E2E on requirements status **names**.
3. **Port 5032 vs README 5000** — false negatives on UAT-API-001.
4. **DEF-014** — users page lies about `active` in live mode.
5. **Test-data isolation** — `ApiFlowTests` hit shared LocalDB. Queue 9 → 13; Day 2 Onion Rings Sold out caused a transient **17/18** (`Customer_checkout_can_set_channel`). Restored Available → **18/18**. Not a product defect. Do not treat 18/18 or GitHub Actions CI as UAT Pass.
6. **Loyalty** — Priya points **419 → 422** after **#4829** Completed is an observation only; do **not** mark loyalty calculations fully verified.

Testers: attach Fail to existing IDs; add runtime notes rather than duplicate DEFs.

# BruvHub Requirements Traceability (Must MVP)

**Rule:** code existence is **not** Implemented. Runtime/UAT is recorded only where executed.  
**Statuses:** `Implemented` | `Partial` | `Missing` | `Not Tested` | `Requires Backend Verification`  
**Revision:** Post-merge + live Staff/Admin UAT through 2026-09-30. No row is Implemented solely from `dotnet test` (including the **18/18** after Onion Rings restore).

Administrator ≡ `Admin` (VAL-002 accepted mapping). VAL-001 lifecycle names remain **unaccepted / Open**.

---

## Customer

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-001 | Register | Customer | Create account | API `POST /api/auth/register`. No UI; `endpoints.register` unused. | **Missing** | UAT-CUS-002 | UAT-CUS-002 | DEF-001. API ≠ product. |
| FR-002 | Login | Customer | Authenticate | Demo: any password. Live: `POST /api/auth/login` + JWT. | **Partial** | Demo + live UAT | UAT-CUS-001, UAT-CUS-003 | Live **Requires Runtime Verification**. |
| FR-010 | Browse menu | Customer | View catalogue | Portal still `mock-data.menuItems`. `getMenu()` used by Staff/Admin only. | **Partial** | UAT-CUS-004 | UAT-CUS-004 | Live portal still mock. |
| FR-012 / FR-026 | Unavailable | Customer | Cannot order | Portal hides mock unavailable. API rejects unavailable (`ApiFlowTests`). Staff sold-out persist seen on Admin screens Day 2. **Portal not tested.** | **Partial** | UAT-CUS-005, UAT-STA-006 | UAT-CUS-005, UAT-STA-006 | DEF-007. UAT-STA-006 **Not Run**. |
| FR-020a | Cart | Customer | Add/qty/total | `useState` in `portal.tsx`. | **Partial** | UAT-CUS-006 | UAT-CUS-006 | Not shared with queue. |
| FR-020b | Persist order | Customer | Real order for user | Portal: `setPlaced(true)` only. API `POST /api/orders` **not** in `endpoints`. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | DEF-002 Critical. |
| FR-021a | Pickup checkout | Customer | Pickup type | No checkout UI. Backend `PlacePickupAsync` unused by UI. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | DEF-003. |
| FR-022 | Cash/Card | Customer | Capture method | No UI. API requires Cash/Card; **`OrderDto` omits it**. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | DEF-004, DEF-015. |
| FR-024 / FR-025 | Confirm + New | Customer | Confirm; start **New** | Fake banner. Implemented status **`Placed`**. VAL-001. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | |
| FR-032 | Track | Customer | Own current status | Mock history by `user.id`. `GET /api/orders` unused. | **Partial** | UAT-CUS-008, E2E | UAT-CUS-008, UAT-E2E-001 | |

---

## Staff

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-002 / FR-004 | Login + role | Staff | Staff access; Admin denied | `AppShell` + API `[Authorize]`. 403 tested for Customer vs staff routes. Live Jason Reid login used as environment for STA-003/004. | **Partial** | UAT-STA-001/002 | UAT-STA-001, UAT-STA-002 | UAT-STA-001/002 **Not Run** as separate cases (negative Admin not executed). |
| FR-030 | Order queue | Staff | View/filter | `orders.tsx` + `useLoad(getOrderQueue)`. Live GET staff orders. | **Partial** | UAT-STA-003 | UAT-STA-003 | UAT-STA-003 **Pass** for live queue **view/load**. Filter step not separately recorded. Shared LocalDB tests grew queue 9→13 (isolation remains). Not Implemented (filters / Customer share). |
| FR-031 | Status updates | Staff | Requirements lifecycle; reject invalid | UI `Placed→In kitchen→Ready→Completed`. API `OrderLifecycle` + 409. | **Partial** | UAT-STA-004/005 | UAT-STA-004, UAT-STA-005 | **VAL-001 Open.** UAT-STA-004 original **Fail** (DEF-017) then **Pass retest** on implemented names (`#4808` Placed→In kitchen; `#4813` In kitchen→Ready→Completed; `#4808` Ready not observed). UAT-STA-005 invalid transitions **Not Run**. DEF-017 **Resolved / Verified**. |
| FR-014 | Availability | Staff | Toggle; Customer sees it | Live `/availability` 10 items; Onion Rings Available→Sold out persisted after Ctrl+R; Admin dashboard (2 sold-out: Koeksister Bites, Onion Rings) and Admin menu matched. Rings later **restored Available** (test-data, after suite 17/18). **Customer portal not verified.** | **Partial** | UAT-STA-006/007 | UAT-STA-006, UAT-STA-007 | UAT-STA-007 **Pass**. DEF-006 404 **Closed**. UAT-STA-006 **Not Run**. DEF-007 open. |

---

## Administrator (`Admin`)

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-002 / FR-004 | Login + role | Administrator | Admin functions | Live Thandi Mokoena login. Dashboard/menu/users/reports/audit used Day 2. `/orders` as Admin not recorded. | **Partial** | UAT-ADM-001/006 | UAT-ADM-001, UAT-ADM-006 | UAT-ADM-001 **Not Run** (incomplete step list). |
| FR-013 | Menu CRUD | Administrator | Create/update/remove | Day 2: Menu Catalogue 10 items; Malva Pudding stock 12→13 persisted after refresh; restored 13→12. No DELETE. Portal isolated. | **Partial** | UAT-ADM-002 | UAT-ADM-002 | UAT-ADM-002 **Not Run** (not full CRUD). DEF-011; DEF-016. |
| FR-005 / FR-072 | Users | Administrator | View; roles; activate | Day 2: Users page loaded **8** users (Admin/Customer/Staff). Active column **not** trusted (DEF-014). Toggle/login impact not run. | **Partial** | UAT-ADM-003 | UAT-ADM-003 | UAT-ADM-003 **Not Run**. DEF-005 404 closed as page load; DEF-014 open. |
| FR-070 | Reports | Administrator | Order/sales | Day 2: live Reports populated (order count, completed sales, revenue by day, best sellers, sales by channel). Totals **not** independently verified. | **Partial** | UAT-ADM-004 | UAT-ADM-004 | UAT-ADM-004 **Not Run**. DEF-012 partial. |
| FR-071 | Audit | Administrator | Action log | Day 2: 12 audit entries; **Thandi Mokoena updated menu item — Malva Pudding** present (multiple rows from save/restore). Time/read-only not asserted. | **Partial** | UAT-ADM-005 | UAT-ADM-005 | UAT-ADM-005 **Not Run**. |

---

## Cross-cutting

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| NFR-SEC-02 | Authorization | All | Server enforces roles | API roles + `ApiFlowTests` 403. Day 2: unauthenticated `GET /api/admin/users` → **401**. `AppShell` still client-only. | **Partial** | UAT + API | UAT-STA-002, UAT-ADM-006 | DEF-010. 401 is not UAT-ADM-006 / STA-002. |
| NFR-REL-03 | Shared lifecycle | Customer + Staff | Same order; requirements statuses | Backend can share. **Portal not wired.** Status names ≠ requirements. | **Missing** | UAT-E2E-001 | UAT-E2E-001 | DEF-002 + **VAL-001 Open**. UAT-E2E-001 **Blocked**. |
| INT-API | Live MVP data | All | API drives Must data | Staff/Admin `data.ts` yes (queue, availability, menu edit, users list, reports, audit). Customer Must **no**. | **Partial** | UAT-API-001 | UAT-API-001 | Use port **5032**. UAT-API-001 **Not Run**. |

---

## End-to-end Must path

Still **not** executable as specified: portal does not persist Pickup/Cash/Card/`New`, and VAL-001 is **Open**. UAT-E2E-001 is **Blocked** (DEF-002). Staff implemented lifecycle on existing orders does **not** Pass E2E.

Staff live path on `:5032`: queue **Pass** (UAT-STA-003); implemented status **Pass on retest** (UAT-STA-004); availability nav/toggle **Pass** (UAT-STA-007). DEF-017 **Resolved / Verified**. DEF-006 404 **Closed**. VAL-001 remains **Open** (New→Confirmed→Preparing→ReadyForPickup vs Placed→In kitchen→Ready→Completed).

---

## Counts (post-merge + Staff runtime notes)

| Implementation status | Rows |
|---|---|
| Implemented | **0** |
| Partial | **16** |
| Missing | **6** |
| Not Tested (execution / UAT) | Customer + remaining Staff (STA-001/002/005/006) + Admin cases still Not Run + UAT-API-001 |

**22** rows: Customer 10, Staff 4, Administrator 5, Cross-cutting 3.

Missing: FR-001, FR-020b, FR-021a, FR-022, FR-024/025, NFR-REL-03.

# BruvHub Requirements Traceability (Must MVP)

**Rule:** code existence is **not** Implemented. Runtime/UAT is recorded only where executed.  
**Statuses:** `Implemented` | `Partial` | `Missing` | `Not Tested` | `Requires Backend Verification`  
**Revision:** Post-merge + live Staff UAT 2026-09-29. No row is Implemented solely from `dotnet test`.

Administrator ≡ `Admin` (VAL-002 accepted mapping). VAL-001 lifecycle names remain **unaccepted / Open**.

---

## Customer

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-001 | Register | Customer | Create account | API `POST /api/auth/register`. No UI; `endpoints.register` unused. | **Missing** | UAT-CUS-002 | UAT-CUS-002 | DEF-001. API ≠ product. |
| FR-002 | Login | Customer | Authenticate | Demo: any password. Live: `POST /api/auth/login` + JWT. | **Partial** | Demo + live UAT | UAT-CUS-001, UAT-CUS-003 | Live **Requires Runtime Verification**. |
| FR-010 | Browse menu | Customer | View catalogue | Portal still `mock-data.menuItems`. `getMenu()` used by Staff/Admin only. | **Partial** | UAT-CUS-004 | UAT-CUS-004 | Live portal still mock. |
| FR-012 / FR-026 | Unavailable | Customer | Cannot order | Portal hides mock unavailable. API rejects unavailable (`ApiFlowTests`). Staff `/availability` does not feed portal. | **Partial** | UAT-CUS-005, UAT-STA-006 | UAT-CUS-005, UAT-STA-006 | DEF-007. |
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
| FR-030 | Order queue | Staff | View/filter | `orders.tsx` + `useLoad(getOrderQueue)`. Live GET staff orders. | **Partial** | UAT-STA-003 | UAT-STA-003 | UAT-STA-003 **Pass** for live queue **view/load**. Filter step not separately recorded. Shared-DB tests grew queue 9→13. Not Implemented (filters / Customer share). |
| FR-031 | Status updates | Staff | Requirements lifecycle; reject invalid | UI `Placed→In kitchen→Ready→Completed`. API `OrderLifecycle` + 409. | **Partial** | UAT-STA-004/005 | UAT-STA-004, UAT-STA-005 | **VAL-001 Open.** UAT-STA-004 original **Fail** (DEF-017) then **Pass retest** on implemented names (`#4808` Placed→In kitchen; `#4813` In kitchen→Ready→Completed; `#4808` Ready not observed). UAT-STA-005 invalid transitions **Not Run**. DEF-017 **Resolved / Verified**. |
| FR-014 | Availability | Staff | Toggle; Customer sees it | **`/availability` exists** (`useLoad` + `setAvailability`). Portal mock unchanged. | **Partial** | UAT-STA-006/007 | UAT-STA-006, UAT-STA-007 | DEF-006 resolved as 404; DEF-007 remains. |

---

## Administrator (`Admin`)

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-002 / FR-004 | Login + role | Administrator | Admin functions | Same auth; Admin nav. API Admin-only controllers. | **Partial** | UAT-ADM-001/006 | UAT-ADM-001, UAT-ADM-006 | |
| FR-013 | Menu CRUD | Administrator | Create/update/remove | `menu.tsx` create+**edit** via `saveMenuItem`. No DELETE API/UI. Portal isolated. | **Partial** | UAT-ADM-002 | UAT-ADM-002 | DEF-011 partial; DEF-016. |
| FR-005 / FR-072 | Users | Administrator | View; roles; activate | **`/users` exists**; activate/deactivate. No role edit. Live list may force `active: true`. | **Partial** | UAT-ADM-003 | UAT-ADM-003 | Was Missing pre-merge. DEF-005 404 resolved; DEF-014. |
| FR-070 | Reports | Administrator | Order/sales | `reports.tsx`/`dashboard.tsx` + `getReport`. Live `ReportService`. Demo still uses some mock series. No date filter. | **Partial** | UAT-ADM-004 | UAT-ADM-004 | DEF-012 partial. |
| FR-071 | Audit | Administrator | Action log | `audit-logs.tsx` + `getAuditLog`. Live admin audit. | **Partial** | UAT-ADM-005 | UAT-ADM-005 | DEF-012 partial. |

---

## Cross-cutting

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| NFR-SEC-02 | Authorization | All | Server enforces roles | API roles + `ApiFlowTests` 403. `AppShell` still client-only. | **Partial** | UAT + API | UAT-STA-002, UAT-ADM-006 | DEF-010 partial. |
| NFR-REL-03 | Shared lifecycle | Customer + Staff | Same order; requirements statuses | Backend can share. **Portal not wired.** Status names ≠ requirements. | **Missing** | UAT-E2E-001 | UAT-E2E-001 | DEF-002 + **VAL-001 Open**. UAT-E2E-001 **Blocked**. Staff-only lifecycle Pass does not satisfy this row. |
| INT-API | Live MVP data | All | API drives Must data | Staff/Admin `data.ts` yes. Customer Must **no**. | **Partial** | UAT-API-001 | UAT-API-001 | Use port **5032**. |

---

## End-to-end Must path

Still **not** executable as specified: portal does not persist Pickup/Cash/Card/`New`, and VAL-001 is **Open**. UAT-E2E-001 is **Blocked** (DEF-002). Staff implemented lifecycle on existing orders does **not** Pass E2E.

Staff live path on `:5032` (2026-09-29): queue **Pass** (UAT-STA-003); implemented status **Pass on retest** (UAT-STA-004) after original DEF-017 Fail. DEF-017 **Resolved / Verified**. VAL-001 remains **Open** (New→Confirmed→Preparing→ReadyForPickup vs Placed→In kitchen→Ready→Completed).

---

## Counts (post-merge + Staff runtime notes)

| Implementation status | Rows |
|---|---|
| Implemented | **0** |
| Partial | **16** |
| Missing | **6** |
| Not Tested (execution / UAT) | Customer + Admin + remaining Staff (availability, STA-001/002/005) + UAT-API-001 |

**22** rows: Customer 10, Staff 4, Administrator 5, Cross-cutting 3.

Missing: FR-001, FR-020b, FR-021a, FR-022, FR-024/025, NFR-REL-03.

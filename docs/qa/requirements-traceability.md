# BruvHub Requirements Traceability (Must MVP)

**Rule:** code existence is **not** Implemented. Runtime/UAT is recorded only where executed.  
**Statuses:** `Implemented` | `Partial` | `Missing` | `Not Tested` | `Requires Backend Verification`  
**Revision:** Post-merge + live Staff/Admin UAT through 2026-09-30 + Day 3 (2026-10-01) Customer **#4829** and Staff dashboard DEF-018. No row is Implemented solely from `dotnet test` or GitHub Actions CI (including the **18/18** after Onion Rings restore).

Administrator ≡ `Admin` (VAL-002 accepted mapping). VAL-001 lifecycle names remain **unaccepted / Open**.

---

## Customer

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-001 | Register | Customer | Create account | API `POST /api/auth/register`. No UI; `endpoints.register` unused. | **Missing** | UAT-CUS-002 | UAT-CUS-002 | DEF-001. API ≠ product. |
| FR-002 | Login | Customer | Authenticate | Demo: any password. Live: `POST /api/auth/login` + JWT. Day 3: Priya Nair used the live Customer Portal (not a demo-login verdict; UAT-CUS-001/003 still Not Run). | **Partial** | Demo + live UAT | UAT-CUS-001, UAT-CUS-003 | Live **Requires Runtime Verification** for invalid credentials. |
| FR-010 | Browse menu | Customer | View catalogue | Day 3: Priya ordered Homemade Lemonade **R32** from the live portal (**#4829**). Dedicated UAT-CUS-004 catalogue review **Not Run**. | **Partial** | UAT-CUS-004 | UAT-CUS-004 | Live place implies a live catalogue was used; case still Not Run. |
| FR-012 / FR-026 | Unavailable | Customer | Cannot order | Portal hides mock unavailable. API rejects unavailable (`ApiFlowTests`). Staff sold-out persist seen on Admin screens Day 2. **Portal not tested.** Day 3 **#4829** used an available item. | **Partial** | UAT-CUS-005, UAT-STA-006 | UAT-CUS-005, UAT-STA-006 | DEF-007. UAT-STA-006 **Not Run**. |
| FR-020a | Cart | Customer | Add/qty/total | `useState` in `portal.tsx`. Day 3 place of Lemonade **R32** implies cart was used; UAT-CUS-006 qty/total steps **Not Run**. | **Partial** | UAT-CUS-006 | UAT-CUS-006 | Not a CUS-006 Pass. |
| FR-020b | Persist order | Customer | Real order for user | **Day 3:** Priya Nair live portal created **#4829**; queue **24 → 25**; Jason Reid saw the same order. Pickup/Cash/Card UI still absent (sibling FRs). | **Partial** | UAT-CUS-007 | UAT-CUS-007 | DEF-002 persist **Resolved / Verified**. UAT-CUS-007 **Blocked** on DEF-003/004/VAL-001. |
| FR-021a | Pickup checkout | Customer | Pickup type | Day 3: Customer placed **#4829** **without** explicit Pickup control. Backend can capture pickup; UI still does not expose it. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | DEF-003 Open. |
| FR-022 | Cash/Card | Customer | Capture method | Day 3: no Cash/Card selection on Customer checkout. API may require a method; **`OrderDto` omits it**. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | DEF-004, DEF-015. |
| FR-024 / FR-025 | Confirm + New | Customer | Confirm; start **New** | Day 3: **#4829** persisted as **Placed**, not **New**. VAL-001 Open. | **Missing** | UAT-CUS-007 | UAT-CUS-007 | Implemented start status ≠ requirements New. |
| FR-032 | Track | Customer | Own current status | **Day 3 UAT-CUS-008 Pass:** Priya’s portal showed **#4829** as **In kitchen**, **Ready**, then **Completed** after each Staff transition. Loyalty **419 → 422** observation only. | **Partial** | UAT-CUS-008, E2E | UAT-CUS-008, UAT-E2E-001 | Tracking Implemented-path verified. VAL-001 names unaccepted. E2E still Blocked. |

---

## Staff

| ID | Requirement | Role | Expected behaviour | Current implementation evidence | Implementation status | Planned QA evidence | Test case ID | Notes / gap |
|---|---|---|---|---|---|---|---|---|
| FR-002 / FR-004 | Login + role | Staff | Staff access; Admin denied | `AppShell` + API `[Authorize]`. 403 tested for Customer vs staff routes. Live Jason Reid. **Day 3:** `/dashboard` original 403 (DEF-018) then retest Pass (UAT-STA-001). Negative Admin UI (UAT-STA-002) still Not Run. Backend reports remain Admin-only. | **Partial** | UAT-STA-001/002 | UAT-STA-001, UAT-STA-002 | UAT-STA-001 **Pass (retest)**. UAT-STA-002 **Not Run**. |
| FR-030 | Order queue | Staff | View/filter | `orders.tsx` + `useLoad(getOrderQueue)`. Live GET staff orders. | **Partial** | UAT-STA-003 | UAT-STA-003 | UAT-STA-003 **Pass** for live queue **view/load**. Day 3: **#4829** appeared; count **24 → 25**. Filter step not separately recorded. Shared LocalDB tests grew queue 9→13 (isolation remains). |
| FR-031 | Status updates | Staff | Requirements lifecycle; reject invalid | UI `Placed→In kitchen→Ready→Completed`. API `OrderLifecycle` + 409. | **Partial** | UAT-STA-004/005 | UAT-STA-004, UAT-STA-005 | **VAL-001 Open.** UAT-STA-004 original **Fail** (DEF-017) then **Pass retest**. Day 3: **#4829** Placed→In kitchen→Ready→Completed with Customer confirmation. UAT-STA-005 invalid transitions **Not Run**. DEF-017 **Resolved / Verified**. |
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
| NFR-SEC-02 | Authorization | All | Server enforces roles | API roles + `ApiFlowTests` 403. Day 2: unauthenticated `GET /api/admin/users` → **401**. Day 3: Staff dashboard 403 from Admin-only reports (DEF-018, frontend fix; reports APIs still Admin-only). `AppShell` still client-only. | **Partial** | UAT + API | UAT-STA-002, UAT-ADM-006 | DEF-010. DEF-018 **Resolved / Verified**. 401/403 notes are not UAT-ADM-006 / STA-002. |
| NFR-REL-03 | Shared lifecycle | Customer + Staff | Same order; requirements statuses | **Day 3:** **#4829** shared Customer UI → API/database → Staff UI → status → Customer UI for **implemented** names. Requirements New→Confirmed→Preparing→ReadyForPickup **not** accepted (VAL-001). Pickup/Cash/Card UI missing. | **Partial** | UAT-E2E-001 | UAT-E2E-001 | Implemented path verified. UAT-E2E-001 **Blocked** on DEF-003/004 + VAL-001. Historical DEF-002 persist Blocked retained. |
| INT-API | Live MVP data | All | API drives Must data | Staff/Admin `data.ts` yes. **Day 3:** Customer place/track of **#4829** live. Checkout Pickup/Cash/Card UI still missing. CRM/promotions may still be mock. | **Partial** | UAT-API-001 | UAT-API-001 | Use port **5032**. UAT-API-001 **Not Run**. |

---

## End-to-end Must path

**Implemented lifecycle (Day 3, not a full requirements Pass):** Priya Nair live portal created **#4829**; Jason Reid Staff queue showed the same order; Staff progressed Placed → In kitchen → Ready → Completed; Priya’s portal confirmed each status. That is Customer UI → API/database → Staff UI → status update → Customer UI.

**Still not executable as specified:** no explicit Pickup or Cash/Card checkout controls (DEF-003, DEF-004); VAL-001 **Open** (New→Confirmed→Preparing→ReadyForPickup vs Placed→In kitchen→Ready→Completed). UAT-E2E-001 and UAT-CUS-007 remain **Blocked** on those defined gaps. Do **not** mark the whole E2E case Pass.

Staff live path on `:5032`: queue **Pass** (UAT-STA-003); implemented status **Pass on retest** (UAT-STA-004); availability nav/toggle **Pass** (UAT-STA-007); dashboard **Pass on retest** (UAT-STA-001, DEF-018). Customer tracking **Pass** (UAT-CUS-008). DEF-002 persist **Resolved / Verified**. DEF-017 **Resolved / Verified**. DEF-018 **Resolved / Verified**. DEF-006 404 **Closed**. VAL-001 remains **Open**.

---

## Counts (post-merge + Day 3 runtime notes)

| Implementation status | Rows |
|---|---|
| Implemented | **0** |
| Partial | **18** |
| Missing | **4** |
| Not Tested (execution / UAT) | Remaining Customer (CUS-001–006, 009) + STA-002/005/006 + Admin cases still Not Run + UAT-API-001 |

**22** rows: Customer 10, Staff 4, Administrator 5, Cross-cutting 3.

Missing: FR-001, FR-021a, FR-022, FR-024/025. NFR-REL-03 moved to **Partial** (implemented shared path verified; requirements names and checkout controls still open). FR-020b persist is **Partial** (verified persist; checkout siblings Missing).

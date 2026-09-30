# BruvHub UAT Test Cases

**Revision:** Day 3 (2026-10-01) Customer E2E **#4829** + Staff dashboard DEF-018, on top of Day 2 Staff/Admin UAT (`:5032` / `:8080`). Original Fail/Blocked text retained; current verdicts updated only where Day 3 completed the defined scope. `dotnet test` / GitHub Actions CI are **not** UAT Pass. Transient **17/18** then **18/18** remain automation only.
**Status values:** `Not Run` | `Pass` | `Fail` | `Blocked`  
**Actual result / Status:** do not Pass from code review, `--list-tests`, `dotnet test`, or CI alone. Partial notes do **not** convert a case to Pass.

Administrator implementation value: `Admin`. Requirements lifecycle names stay in **Expected result**; implemented UI/API uses `Placed` / `In kitchen` / `Ready` / `Completed` (VAL-001 **open**). Record actual labels after a real run.

**Live API URL for this repo:** `http://localhost:5032`. Frontend README still mentions `http://localhost:5000` — using 5000 is a tester setup fail, not an API-down defect.

**Live vs mock:** Staff/Admin Must screens use `data.ts` (API if URL set). **Day 3:** Customer Portal live-placed and tracked **#4829**. Checkout still has **no** explicit Pickup or Cash/Card controls (DEF-003/004). CRM/promotions may still be mock.

**Live run environment:** API `http://localhost:5032`; frontend `http://localhost:8080`; live API indicator visible. `GET /health` `{ status: "ok" }` (prior). Staff Jason Reid, Admin Thandi Mokoena, Day 3 Customer **Priya Nair**. Shared LocalDB contamination remains valid (queue 9 → 13; `Customer_checkout_can_set_channel` 17/18 while Onion Rings Sold out; Rings restored Available; subsequent **18/18**, no product-code change). **Day 3 CI:** GitHub Actions on `feature/system-architecture-qa` — backend job Pass; frontend production build Pass (also after DEF-018). VAL-001 **Open**.

---

## Customer

### UAT-CUS-001

| Field | Content |
|---|---|
| **ID** | UAT-CUS-001 |
| **Role** | Customer |
| **Requirement/feature** | FR-002 Login |
| **Priority** | Must |
| **Preconditions** | App running; demo (no API URL) unless noted |
| **Test steps** | 1. Open `/`. 2. Select Customer. 3. Use demo email. 4. Enter any password. 5. Sign in. |
| **Expected result** | Customer reaches `/portal`. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-002

| Field | Content |
|---|---|
| **ID** | UAT-CUS-002 |
| **Role** | Customer |
| **Requirement/feature** | FR-001 Register |
| **Priority** | Must |
| **Preconditions** | App running. API register exists; **UI may still be absent** (DEF-001). |
| **Test steps** | 1. Look for Register. 2. Submit valid Customer details. 3. Sign in with those credentials. |
| **Expected result** | Account created; Customer can authenticate. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-003

| Field | Content |
|---|---|
| **ID** | UAT-CUS-003 |
| **Role** | Customer |
| **Requirement/feature** | FR-002 Invalid credentials |
| **Priority** | Must |
| **Preconditions** | **Live** URL `http://localhost:5032`; API running |
| **Test steps** | 1. Open `/`. 2. Unknown email + wrong password. 3. Sign in. |
| **Expected result** | Fail with clear error; no session. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

*Demo is not a valid run (password ignored).*

---

### UAT-CUS-004

| Field | Content |
|---|---|
| **ID** | UAT-CUS-004 |
| **Role** | Customer |
| **Requirement/feature** | FR-010 Browse menu |
| **Priority** | Must |
| **Preconditions** | Signed in as Customer. Note whether live URL is set — portal may still show **mock** menu. |
| **Test steps** | 1. Open `/portal`. 2. Review Menu. 3. Check name, description, price. |
| **Expected result** | Required item information displayed. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-005

| Field | Content |
|---|---|
| **ID** | UAT-CUS-005 |
| **Role** | Customer |
| **Requirement/feature** | FR-012 / FR-026 Unavailable |
| **Priority** | Must |
| **Preconditions** | `/portal`; mock includes unavailable Koeksister Bites unless portal is later wired to API |
| **Test steps** | 1. Find unavailable item. 2. Attempt to add/order. |
| **Expected result** | Cannot order unavailable items. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-006

| Field | Content |
|---|---|
| **ID** | UAT-CUS-006 |
| **Role** | Customer |
| **Requirement/feature** | FR-020 Cart |
| **Priority** | Must |
| **Preconditions** | Customer on `/portal`; an available item |
| **Test steps** | 1. Add item. 2. Change qty. 3. Check total. |
| **Expected result** | Cart matches selection. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-007

| Field | Content |
|---|---|
| **ID** | UAT-CUS-007 |
| **Role** | Customer |
| **Requirement/feature** | FR-020 / FR-021a / FR-022 / FR-025 Pickup, payment, confirmation, New |
| **Priority** | Must |
| **Preconditions** | Items in cart. Post-merge: API can place pickup orders; **UI may still skip checkout** (DEF-002–004). |
| **Test steps** | 1. Checkout. 2. Pickup. 3. Cash or Card. 4. Confirm. 5. Note id and status. |
| **Expected result** | Pickup + payment captured; persisted order starts **New** (or mapped status if VAL-001 accepted). |
| **Actual result** | **Blocked on remaining checkout Musts — do not Pass.** Day 3: Priya Nair, live Customer Portal, placed **#4829** Homemade Lemonade **R32**. Order persisted (queue **24 → 25**, status **Placed**). Checkout still did **not** expose explicit **Pickup** or **Cash/Card** selection. Implemented start status is **Placed**, not requirements **New** (VAL-001 Open). Persist itself is recorded under DEF-002 Resolved / Verified; this case’s defined Pickup/Cash/Card/New scope is incomplete. |
| **Status** | Blocked |
| **Evidence** | Day 3 2026-10-01 live portal **#4829**; DEF-003, DEF-004, VAL-001. DEF-002 persist no longer blocking. |

---

### UAT-CUS-008

| Field | Content |
|---|---|
| **ID** | UAT-CUS-008 |
| **Role** | Customer |
| **Requirement/feature** | FR-032 Track |
| **Priority** | Must |
| **Preconditions** | Newly placed order (depends on UAT-CUS-007). Portal history may still be **static mock**. |
| **Test steps** | 1. Open history/tracking. 2. Find the new order. 3. Record status. |
| **Expected result** | The **new** order is listed with current status. |
| **Actual result** | **Pass (implemented tracking).** Day 3: Priya Nair’s Customer Portal showed live **#4829**. After each Staff transition the same portal displayed **In kitchen**, then **Ready**, then **Completed**. Loyalty points visibly **419 → 422** after completion — observation only; **do not** treat loyalty calculations as fully verified. VAL-001 names remain unaccepted. |
| **Status** | Pass |
| **Evidence** | Day 3 2026-10-01 Priya Nair; **#4829** tracked through implemented lifecycle. |

---

### UAT-CUS-009

| Field | Content |
|---|---|
| **ID** | UAT-CUS-009 |
| **Role** | Customer |
| **Requirement/feature** | FR-004 Negative |
| **Priority** | Must |
| **Preconditions** | Signed in as Customer |
| **Test steps** | 1. Open `/orders`. 2. `/menu`. 3. `/reports`. 4. `/audit-logs`. |
| **Expected result** | Denied (redirect). API 403 is separate (`ApiFlowTests`). |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

## Staff

### UAT-STA-001

| Field | Content |
|---|---|
| **ID** | UAT-STA-001 |
| **Role** | Staff |
| **Requirement/feature** | FR-002 / FR-004 |
| **Priority** | Must |
| **Preconditions** | Demo or live Staff (`jason@stackedfoods.co.za` / `Stacked123!` when live) |
| **Test steps** | 1. Sign in as Staff. 2. Confirm `/dashboard` or `/orders`. |
| **Expected result** | Staff UI available. |
| **Actual result** | **Original execution (Day 3 `/dashboard`): Fail.** Jason Reid signed in live; Staff routing/authentication valid. `/orders` already used Day 2. `/dashboard` initially failed with an HTTP **403**-derived UI access error because the shared Staff/Admin dashboard required Admin-only `getReport()` / `/api/reports` (**DEF-018**). **Retest: Pass.** After the frontend-only fix (report request Admin-only; Staff still loads orders/menu), Jason Reid `/dashboard` loaded successfully with live order/menu data and **no** access error. Backend report authorization was **not** weakened. |
| **Status** | Pass (retest). Original Fail retained above. |
| **Evidence** | Day 3 2026-10-01 DEF-018 original Fail + Jason Reid dashboard retest. Production frontend build Pass after the fix. |

---

### UAT-STA-002

| Field | Content |
|---|---|
| **ID** | UAT-STA-002 |
| **Role** | Staff |
| **Requirement/feature** | FR-004 Negative Admin |
| **Priority** | Must |
| **Preconditions** | Signed in as Staff |
| **Test steps** | 1. Confirm Users/Reports/Audit not in nav. 2. Direct `/reports`, `/audit-logs`, `/users`. |
| **Expected result** | Admin functions denied. |
| **Actual result** | Not Run (Admin nav/direct-route denial not executed as this case). Day 3 related: Staff `/dashboard` 403 was **DEF-018** (mandatory Admin reports call), not evidence that Staff cannot open Users/Reports/Audit. After the fix, Staff dashboard no longer requests reports; backend `/api/reports` remains Admin-only. Do **not** Pass this case from DEF-018. |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-STA-003

| Field | Content |
|---|---|
| **ID** | UAT-STA-003 |
| **Role** | Staff |
| **Requirement/feature** | FR-030 Queue |
| **Priority** | Must |
| **Preconditions** | Staff. Live: queue from API via `getOrderQueue`. |
| **Test steps** | 1. Open `/orders`. 2. Filter by status. 3. Note identity, time, channel, status. |
| **Expected result** | Queue shows orders; filters work as implemented. |
| **Actual result** | **Pass (queue view/load).** Live Staff Jason Reid on `:8080` / `:5032`. `/orders` showed live backend orders (including `#4808` Placed, `#4813` In kitchen). Filter-by-status was not a separately recorded step; this Pass is for **viewing/loading** the live queue (FR-030 load), not for status transitions. Queue count rose 9 → 13 after `dotnet test` (shared-DB contamination). **Day 3:** same Staff queue showed Customer-placed **#4829** Homemade Lemonade **R32** as **Placed**; order count **24 → 25**. |
| **Status** | Pass |
| **Evidence** | Live UAT 2026-09-29; Staff authenticated; live queue. Day 3: **#4829** appeared Placed; count 24 → 25. |

---

### UAT-STA-004

| Field | Content |
|---|---|
| **ID** | UAT-STA-004 |
| **Role** | Staff |
| **Requirement/feature** | FR-031 Valid lifecycle |
| **Priority** | Must |
| **Preconditions** | Order in starting state. **Do not Pass on requirements names** without VAL-001. |
| **Test steps** | 1. Advance through implemented or requirements chain. 2. Refresh. 3. Check Customer tracking if a real shared order exists. |
| **Expected result** | Valid steps persist; Customer sees the same order (blocked if portal mock). |
| **Actual result** | **Original execution: Fail.** Staff Jason Reid, live `:5032` / `:8080`. Accept on `#4808` while **Placed**. UI: “One or more validation errors occurred.” Order remained **Placed**. No UPDATE SQL. PATCH `{ "status": "In kitchen" }` failed bind (`In kitchen` vs `InKitchen`; converter order). **DEF-017.** VAL-001 is unrelated (requirements names). **Retest: Pass (implemented Staff lifecycle, API restarted).** `#4808` still Placed before retest. Accept → **In kitchen**; full browser reload; remained In kitchen and showed **Mark ready**. Persistence verified. **Do not claim `#4808` was observed at Ready.** `#4813` began In kitchen; Mark ready; full reload; remained **Ready** (Complete). Complete; full reload; remained **Completed** with no further progression action. Persistence verified for In kitchen→Ready and Ready→Completed. Implemented chain is evidenced **collectively** across `#4808` and `#4813`. Customer tracking **not** executed on Day 2 (portal then unwired). **Day 3 addendum (does not change this retest Pass):** Priya Nair’s portal tracked **#4829** after each Staff step (**In kitchen**, **Ready**, **Completed**). VAL-001 still Open. |
| **Status** | Pass (retest). Original Fail retained above. |
| **Evidence** | Original Fail: live 2026-09-29 DEF-017. Retest: same day, restarted API; reload persistence on `#4808` / `#4813`. Automated: 18/18 including `Staff_status_patch_accepts_frontend_in_kitchen_wire_value`. Day 3: Customer tracking of **#4829**. |

---

### UAT-STA-005

| Field | Content |
|---|---|
| **ID** | UAT-STA-005 |
| **Role** | Staff |
| **Requirement/feature** | FR-031 Invalid transition |
| **Priority** | Must |
| **Preconditions** | Mid-lifecycle order; live API for HTTP 409 if skipping via API |
| **Test steps** | 1. Attempt skip/revert (UI and/or API). |
| **Expected result** | Rejected; status unchanged. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-STA-006

| Field | Content |
|---|---|
| **ID** | UAT-STA-006 |
| **Role** | Staff |
| **Requirement/feature** | FR-014 Availability vs Customer |
| **Priority** | Must |
| **Preconditions** | `/availability` + Customer `/portal` (second session) |
| **Test steps** | 1. Mark unavailable. 2. Customer attempts order. 3. Restore. |
| **Expected result** | Customer catalogue reflects change. **Post-merge likely Fail if portal still mock** (DEF-007) — still record after execution only. |
| **Actual result** | **Not Run** as this case. Day 2 note (does **not** Pass FR-014 vs Customer): Staff Jason Reid, live `/availability`, 10 items. Onion Rings Available → Sold out; no UI error; Ctrl+R; remained Sold out. Admin dashboard then showed **2** sold-out items (Koeksister Bites and Onion Rings). Admin Menu Catalogue showed Onion Rings Sold out. **Customer portal availability was not tested.** After the controlled UAT, Onion Rings was restored to **Available** so the shared LocalDB would not fail `Customer_checkout_can_set_channel` (automation isolation; **not** a STA-006 Pass). DEF-007 remains. Related Pass: UAT-STA-007. |
| **Status** | Not Run |
| **Evidence** | Day 2 2026-09-30 Staff persist + Admin visibility only; portal not executed |

---

### UAT-STA-007

| Field | Content |
|---|---|
| **ID** | UAT-STA-007 |
| **Role** | Staff |
| **Requirement/feature** | FR-014 Availability navigation |
| **Priority** | Must |
| **Preconditions** | Staff. **Route `/availability` now exists** (DEF-006 404 resolved in code). |
| **Test steps** | 1. Click Item Availability. 2. Confirm working UI. |
| **Expected result** | Not a 404; toggles load. |
| **Actual result** | **Pass.** Staff Jason Reid, live API. Item Availability loaded **10** menu items (not a 404). Onion Rings was Available; Staff set Sold out; no visible error; full Ctrl+R; Onion Rings remained Sold out. Toggles loaded and the change persisted. |
| **Status** | Pass |
| **Evidence** | Live UAT 2026-09-30; `/availability`; Ctrl+R persistence. DEF-006 404 closed by this run. |

---

## Administrator (`Admin`)

### UAT-ADM-001

| Field | Content |
|---|---|
| **ID** | UAT-ADM-001 |
| **Role** | Administrator |
| **Requirement/feature** | FR-002 / FR-004 |
| **Priority** | Must |
| **Preconditions** | Demo Admin or live `thandi@stackedfoods.co.za` / `Stacked123!` |
| **Test steps** | 1. Sign in as Admin. 2. Open dashboard, orders, menu, reports, audit, users. |
| **Expected result** | Management UI accessible. |
| **Actual result** | **Not Run** as this case (orders page not recorded). Day 2 note: Admin Thandi Mokoena signed in live (`:8080` / `:5032`). Dashboard, Menu Catalogue, Users, Reports, and Audit Logs were used in later cases. Direct `/orders` as Admin was not recorded. |
| **Status** | Not Run |
| **Evidence** | Day 2 environment only; full step list not completed |

---

### UAT-ADM-002

| Field | Content |
|---|---|
| **ID** | UAT-ADM-002 |
| **Role** | Administrator |
| **Requirement/feature** | FR-013 Menu |
| **Priority** | Must |
| **Preconditions** | Admin; `/menu` uses `saveMenuItem`. No DELETE API. |
| **Test steps** | 1. Create. 2. Edit name/price. 3. Remove/deactivate if possible. 4. Check Customer menu. 5. Refresh. |
| **Expected result** | Changes persist; Customer catalogue updates where applicable. |
| **Actual result** | **Not Run** as this case (create, name/price, DELETE, Customer menu not executed). Day 2 note: Admin Thandi, live Menu Catalogue loaded **10** items. Malva Pudding stock **12 → 13**, save, refresh, reopen showed **13**. Test data restored **13 → 12**. Persistence of this stock edit through the live backend is verified. No DELETE claim. Customer catalogue not checked. |
| **Status** | Not Run |
| **Evidence** | Day 2 2026-09-30 stock-edit persist only; DEF-016 DELETE still open |

---

### UAT-ADM-003

| Field | Content |
|---|---|
| **ID** | UAT-ADM-003 |
| **Role** | Administrator |
| **Requirement/feature** | FR-005 / FR-072 Users |
| **Priority** | Must |
| **Preconditions** | Admin. **`/users` exists** (DEF-005 404 resolved). Watch DEF-014 (all Active on load). |
| **Test steps** | 1. Open Users. 2. View accounts. 3. Toggle active. 4. Confirm login impact. Role change if present. |
| **Expected result** | Active-state persists and enforces access. |
| **Actual result** | **Not Run** as this case (active toggle and login impact not executed). Day 2 note: Admin Users page loaded from live API; **8** users shown across Admin, Customer, and Staff. **Displayed Active is not trusted** (DEF-014 live map forces `active: true`). Scope verified: list load/view only. |
| **Status** | Not Run |
| **Evidence** | Day 2 2026-09-30 list load; DEF-014 |

---

### UAT-ADM-004

| Field | Content |
|---|---|
| **ID** | UAT-ADM-004 |
| **Role** | Administrator |
| **Requirement/feature** | FR-070 Reports |
| **Priority** | Must |
| **Preconditions** | Admin; live `getReport` vs demo mixed mock series |
| **Test steps** | 1. Open `/reports`. 2. Date filter if any. 3. Compare to known orders. |
| **Expected result** | Authoritative totals. |
| **Actual result** | **Not Run** as this case (no date-filter check; totals not compared to known orders). Day 2 note: Admin, Connected to API, Reports loaded with populated data: order count, completed sales, revenue by day, best sellers, sales by channel. **No independent mathematical verification.** |
| **Status** | Not Run |
| **Evidence** | Day 2 2026-09-30 populated live report view only |

---

### UAT-ADM-005

| Field | Content |
|---|---|
| **ID** | UAT-ADM-005 |
| **Role** | Administrator |
| **Requirement/feature** | FR-071 Audit |
| **Priority** | Must |
| **Preconditions** | Admin; live audit after a menu/user change |
| **Test steps** | 1. Mutate menu or user. 2. Open `/audit-logs`. 3. Find matching row. |
| **Expected result** | Actor, action, target, time; read-only UI. |
| **Actual result** | **Not Run** as this case (row **time** and read-only UI not recorded). Day 2 note: after the Malva Pudding stock edit, Audit Logs loaded (**12** entries). Matching row present: **Thandi Mokoena updated menu item — Malva Pudding**. Multiple Malva Pudding rows from save/restore. Actor/action/target of that edit were represented; do not Pass the full expected result. |
| **Status** | Not Run |
| **Evidence** | Day 2 2026-09-30 matching audit row; time/read-only not asserted |

---

### UAT-ADM-006

| Field | Content |
|---|---|
| **ID** | UAT-ADM-006 |
| **Role** | Customer |
| **Requirement/feature** | FR-004 |
| **Priority** | Must |
| **Preconditions** | Customer session |
| **Test steps** | 1. Admin nav hidden. 2. Direct `/reports`, `/audit-logs`. |
| **Expected result** | Cannot use Administrator functions. |
| **Actual result** | Not Run (Customer-session UI denial not executed). Day 2 related API note: unauthenticated `GET http://localhost:5032/api/admin/users` with **no JWT** returned **HTTP 401 Unauthorized**. That does **not** Pass this case. |
| **Status** | Not Run |
| **Evidence** | Manual 401 is RBV-002, not UAT-ADM-006 |

---

## Cross-role

### UAT-E2E-001

| Field | Content |
|---|---|
| **ID** | UAT-E2E-001 |
| **Role** | Customer + Staff |
| **Requirement/feature** | FR-020, FR-025, FR-030, FR-031, FR-032 |
| **Priority** | Must |
| **Preconditions** | Prefer live `:5032`. Portal persist was historically DEF-002. Staff Accept bind (DEF-017) is no longer the blocker. Defined steps still require **Pickup + Cash/Card**. |
| **Test steps** | 1. Customer Pickup + Cash/Card. 2. Confirm New (or mapped). 3. Staff finds **that** order. 4. Advance lifecycle. 5. Customer confirms each status. |
| **Expected result** | One persisted order; both roles consistent. |
| **Actual result** | **Still Blocked on defined checkout/requirements scope — do not Pass the whole case.** Historical Blocked (Day 2): portal did not persist, so Staff could not find **that** Customer order. **Day 3 implemented E2E (verified, not a full Pass):** Priya Nair live portal created **#4829** Homemade Lemonade **R32**; queue **24 → 25**, **Placed**. Jason Reid Staff Order Queue showed the **exact same** **#4829**. Staff progressed **Placed → In kitchen → Ready → Completed**. Priya’s portal was checked after each transition and showed **In kitchen**, **Ready**, then **Completed**. This verifies **Customer UI → API/database → Staff UI → status update → Customer UI** for the **implemented** lifecycle. Remaining gaps that keep the case Blocked: checkout still has **no** explicit Pickup or Cash/Card controls (DEF-003, DEF-004); start/status names remain **Placed…Completed**, not New→Confirmed→Preparing→ReadyForPickup (**VAL-001 Open**). Loyalty **419 → 422** after completion is observation only — not a loyalty-calculation Pass. |
| **Status** | Blocked |
| **Evidence** | Day 2: DEF-002 persist Blocked (historical). Day 3: **#4829** implemented path verified; DEF-003, DEF-004, VAL-001 keep the defined case Blocked. DEF-017 not blocking. |

---

### UAT-API-001

| Field | Content |
|---|---|
| **ID** | UAT-API-001 |
| **Role** | Operator |
| **Requirement/feature** | Live connectivity |
| **Priority** | Must (smoke) |
| **Preconditions** | API on **5032** (not README 5000) |
| **Test steps** | 1. Settings: URL, Test. 2. Save, live sign-in. 3. Record which screens are API vs mock (expect portal mock). |
| **Expected result** | `/health` OK; login JWT; tester lists mock vs live screens. |
| **Actual result** | Not Run (Settings Test/Save flow not recorded as this case). Day 2 environment: live API indicator visible on `:8080`; Admin/Staff used Connected-to-API screens. **Day 3:** Customer Portal also live-placed **#4829**. Checkout Pickup/Cash/Card UI still absent. |
| **Status** | Not Run |
| **Evidence** | Live indicator is environment, not this smoke case |

---

## Execution summary

| Test ID | Role | Priority | Status | Defect ID |
|---|---|---|---|---|
| UAT-CUS-001 | Customer | Must | Not Run | — |
| UAT-CUS-002 | Customer | Must | Not Run | — |
| UAT-CUS-003 | Customer | Must | Not Run | — |
| UAT-CUS-004 | Customer | Must | Not Run | — |
| UAT-CUS-005 | Customer | Must | Not Run | — |
| UAT-CUS-006 | Customer | Must | Not Run | — |
| UAT-CUS-007 | Customer | Must | Blocked | DEF-003, DEF-004, VAL-001. Persist of **#4829** recorded; Pickup/Cash/Card/New not met. |
| UAT-CUS-008 | Customer | Must | Pass | **#4829** tracked In kitchen → Ready → Completed. Loyalty 419→422 observation only. |
| UAT-CUS-009 | Customer | Must | Not Run | — |
| UAT-STA-001 | Staff | Must | Pass (retest) | DEF-018 original Fail on `/dashboard` retained; retest Pass. |
| UAT-STA-002 | Staff | Must | Not Run | DEF-018 is dashboard reports, not this negative-Admin case. |
| UAT-STA-003 | Staff | Must | Pass | — (live queue view/load; not a status-transition test) |
| UAT-STA-004 | Staff | Must | Pass (retest) | DEF-017 original Fail retained in case; now Resolved / Verified |
| UAT-STA-005 | Staff | Must | Not Run | — (invalid skip/revert not executed) |
| UAT-STA-006 | Staff | Must | Not Run | DEF-007 (portal not executed; Staff/Admin persist noted in case) |
| UAT-STA-007 | Staff | Must | Pass | DEF-006 404 closed by this run |
| UAT-ADM-001 | Administrator | Must | Not Run | — (Day 2 note only; `/orders` not recorded) |
| UAT-ADM-002 | Administrator | Must | Not Run | — (stock-edit persist noted; not full CRUD) |
| UAT-ADM-003 | Administrator | Must | Not Run | DEF-014 (list load noted; Active not trusted) |
| UAT-ADM-004 | Administrator | Must | Not Run | — (populated view noted; totals not verified) |
| UAT-ADM-005 | Administrator | Must | Not Run | — (matching Malva row noted; time/read-only not asserted) |
| UAT-ADM-006 | Customer | Must | Not Run | — |
| UAT-E2E-001 | Cross-role | Must | Blocked | Implemented **#4829** path verified. Defined Pickup/Cash/Card + VAL-001 still Blocked (DEF-003, DEF-004). Historical DEF-002 persist Blocked retained in case. |
| UAT-API-001 | Integration | Must | Not Run | — (live indicator is environment, not this case) |

**Passed:** 5 (UAT-CUS-008; UAT-STA-001 retest; UAT-STA-003; UAT-STA-004 retest; UAT-STA-007)  **Failed (current):** 0  **Blocked:** 2 (UAT-CUS-007; UAT-E2E-001)  **Not Run:** 17

Historical: UAT-STA-004 original execution remains **Fail** in the case body (DEF-017). UAT-STA-001 original `/dashboard` Fail remains in the case body (DEF-018). UAT-E2E-001 historical persist Blocked remains in the case body. Do not treat historical Fails as current verdicts. `--list-tests` (18 discovered) is not execution. Automated Day 2: **17/18** then Onion Rings restore then **18/18** — **not** UAT Pass. Day 3 GitHub Actions CI (backend + frontend production build) — **not** UAT Pass.

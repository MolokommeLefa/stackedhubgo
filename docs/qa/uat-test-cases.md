# BruvHub UAT Test Cases

**Revision:** Post-merge notes added. **No case has been executed.**  
**Status values:** `Not Run` | `Pass` | `Fail` | `Blocked`  
**Actual result / Status:** **Not Run** — do not Pass from code review or from `dotnet test`.

Administrator implementation value: `Admin`. Requirements lifecycle names stay in **Expected result**; implemented UI/API uses `Placed` / `In kitchen` / `Ready` (VAL-001 **open**). Record actual labels after a real run.

**Live API URL for this repo:** `http://localhost:5032`. Frontend README still mentions `http://localhost:5000` — using 5000 is a tester setup fail, not an API-down defect.

**Live vs mock:** Staff/Admin Must screens use `data.ts` (API if URL set). **Customer portal menu/cart/place/history stay on mock even when connected.**

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

## Cross-role

### UAT-E2E-001

| Field | Content |
|---|---|
| **ID** | UAT-E2E-001 |
| **Role** | Customer + Staff |
| **Requirement/feature** | FR-020, FR-025, FR-030, FR-031, FR-032 |
| **Priority** | Must |
| **Preconditions** | Prefer live `:5032`. Portal likely **not** sharing staff queue until wired. |
| **Test steps** | 1. Customer Pickup + Cash/Card. 2. Confirm New (or mapped). 3. Staff finds **that** order. 4. Advance lifecycle. 5. Customer confirms each status. |
| **Expected result** | One persisted order; both roles consistent. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

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
| UAT-CUS-007 | Customer | Must | Not Run | — |
| UAT-CUS-008 | Customer | Must | Not Run | — |
| UAT-CUS-009 | Customer | Must | Not Run | — |
| UAT-STA-001 | Staff | Must | Not Run | — |
| UAT-STA-002 | Staff | Must | Not Run | — |
| UAT-STA-003 | Staff | Must | Not Run | — |
| UAT-STA-004 | Staff | Must | Not Run | — |
| UAT-STA-005 | Staff | Must | Not Run | — |
| UAT-STA-006 | Staff | Must | Not Run | — |
| UAT-STA-007 | Staff | Must | Not Run | — |
| UAT-ADM-001 | Administrator | Must | Not Run | — |
| UAT-ADM-002 | Administrator | Must | Not Run | — |
| UAT-ADM-003 | Administrator | Must | Not Run | — |
| UAT-ADM-004 | Administrator | Must | Not Run | — |
| UAT-ADM-005 | Administrator | Must | Not Run | — |
| UAT-ADM-006 | Customer | Must | Not Run | — |
| UAT-E2E-001 | Cross-role | Must | Not Run | — |
| UAT-API-001 | Integration | Must | Not Run | — |

**Passed:** 0  **Failed:** 0  **Not Run:** 24

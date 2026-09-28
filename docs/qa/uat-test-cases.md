# BruvHub UAT Test Cases

**Environment default:** Demo (no API URL) unless a step says Live.  
**Status values:** `Not Run` | `Pass` | `Fail` | `Blocked`  
**Actual result / Status:** **Not Run** until a tester executes the case. Do not Pass from code review.

Implemented role value for Administrator is `Admin`. Requirements lifecycle names are used in **Expected result**; current UI uses `Placed` / `In kitchen` / `Ready` (see VAL-001). Record what the UI actually shows in Actual result after execution.

---

## Customer

### UAT-CUS-001

| Field | Content |
|---|---|
| **ID** | UAT-CUS-001 |
| **Role** | Customer |
| **Requirement/feature** | FR-002 Login |
| **Priority** | Must |
| **Preconditions** | App running; demo mode (no API URL) unless noted |
| **Test steps** | 1. Open `/`. 2. Select Customer. 3. Use demo email (or any email). 4. Enter any password. 5. Sign in. |
| **Expected result** | Customer reaches `/portal`. Protected Staff/Admin pages are not the landing page. |
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
| **Preconditions** | App running |
| **Test steps** | 1. From sign-in, look for Register. 2. Submit valid new Customer details. 3. Sign in with those credentials. |
| **Expected result** | Account is created; Customer can authenticate with those credentials. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-003

| Field | Content |
|---|---|
| **ID** | UAT-CUS-003 |
| **Role** | Customer |
| **Requirement/feature** | FR-002 Invalid credentials (negative) |
| **Priority** | Must |
| **Preconditions** | **Live API** URL set; backend available |
| **Test steps** | 1. Open `/`. 2. Enter unknown email and wrong password. 3. Sign in (role tab unused for live body). |
| **Expected result** | Sign-in fails with a clear error; no authenticated session. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

*Demo mode is not a valid run of this case (password is ignored).*

---

### UAT-CUS-004

| Field | Content |
|---|---|
| **ID** | UAT-CUS-004 |
| **Role** | Customer |
| **Requirement/feature** | FR-010 Browse menu |
| **Priority** | Must |
| **Preconditions** | Signed in as Customer |
| **Test steps** | 1. Open `/portal`. 2. Review Menu panel. 3. Check name, description, price. |
| **Expected result** | Menu items display required information. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-005

| Field | Content |
|---|---|
| **ID** | UAT-CUS-005 |
| **Role** | Customer |
| **Requirement/feature** | FR-012 / FR-026 Unavailable items |
| **Priority** | Must |
| **Preconditions** | Customer on `/portal`; mock includes an unavailable item (Koeksister Bites in `mock-data.ts`) |
| **Test steps** | 1. Search the portal menu for an unavailable item. 2. Attempt to add it. |
| **Expected result** | Unavailable items are not orderable (hidden or blocked). |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-006

| Field | Content |
|---|---|
| **ID** | UAT-CUS-006 |
| **Role** | Customer |
| **Requirement/feature** | FR-020 Add to cart |
| **Priority** | Must |
| **Preconditions** | Customer on `/portal`; at least one available item |
| **Test steps** | 1. Add an available item. 2. Increase quantity. 3. Decrease/remove. 4. Check total. |
| **Expected result** | Cart quantities and total match selected items. |
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
| **Preconditions** | Items in cart |
| **Test steps** | 1. Open checkout. 2. Select Pickup. 3. Select Cash or Card. 4. Confirm. 5. Note order id and status. |
| **Expected result** | Checkout captures Pickup and payment method; confirmation shown; persisted order starts as **New**. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-008

| Field | Content |
|---|---|
| **ID** | UAT-CUS-008 |
| **Role** | Customer |
| **Requirement/feature** | FR-032 Track current order |
| **Priority** | Must |
| **Preconditions** | A newly placed order exists for this Customer (depends on UAT-CUS-007) |
| **Test steps** | 1. Open tracking/history. 2. Identify the new order. 3. Record status. |
| **Expected result** | The **new** order is listed with its current status (not only unrelated mock history). |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-CUS-009

| Field | Content |
|---|---|
| **ID** | UAT-CUS-009 |
| **Role** | Customer |
| **Requirement/feature** | FR-004 Negative — Staff/Admin functions |
| **Priority** | Must |
| **Preconditions** | Signed in as Customer |
| **Test steps** | 1. Open `/orders`. 2. Open `/menu`. 3. Open `/reports`. 4. Open `/audit-logs`. |
| **Expected result** | Customer is denied Staff/Admin pages (redirect or equivalent). |
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
| **Requirement/feature** | FR-002 / FR-004 Login and Staff access |
| **Priority** | Must |
| **Preconditions** | Demo or valid Staff account |
| **Test steps** | 1. Sign in as Staff. 2. Confirm `/dashboard` or `/orders` accessible. |
| **Expected result** | Staff operational UI is available after authentication. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-STA-002

| Field | Content |
|---|---|
| **ID** | UAT-STA-002 |
| **Role** | Staff |
| **Requirement/feature** | FR-004 Negative — Administrator functions |
| **Priority** | Must |
| **Preconditions** | Signed in as Staff |
| **Test steps** | 1. Confirm Users / Reports / Audit are not in Staff nav. 2. Open `/reports`, `/audit-logs`, `/users` directly. |
| **Expected result** | Staff cannot use Administrator-only functions (reports, audit, user management). Direct URLs are denied or redirected, not silently usable. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-STA-003

| Field | Content |
|---|---|
| **ID** | UAT-STA-003 |
| **Role** | Staff |
| **Requirement/feature** | FR-030 Order queue |
| **Priority** | Must |
| **Preconditions** | Signed in as Staff |
| **Test steps** | 1. Open `/orders`. 2. Filter by status and channel. 3. Search by reference/customer. |
| **Expected result** | Queue shows orders with identity, time, type/channel, and status; filters work. |
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
| **Preconditions** | An order in New (or current equivalent if mapping agreed) |
| **Test steps** | 1. Advance New → Confirmed. 2. Confirmed → Preparing. 3. Preparing → ReadyForPickup. 4. ReadyForPickup → Completed. 5. Refresh. |
| **Expected result** | Each valid step succeeds and **persists**. Customer tracking shows the same status. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

*If UI only shows Placed / In kitchen / Ready, record Actual labels; do not Pass this case against requirements names without an approved mapping (VAL-001).*

---

### UAT-STA-005

| Field | Content |
|---|---|
| **ID** | UAT-STA-005 |
| **Role** | Staff |
| **Requirement/feature** | FR-031 Invalid transition (negative) |
| **Priority** | Must |
| **Preconditions** | Order in a mid-lifecycle status |
| **Test steps** | 1. Attempt to skip to Completed or revert Completed → New (via UI or API if live). |
| **Expected result** | Invalid transition is rejected; previous valid status remains. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-STA-006

| Field | Content |
|---|---|
| **ID** | UAT-STA-006 |
| **Role** | Staff |
| **Requirement/feature** | FR-014 Item availability |
| **Priority** | Must |
| **Preconditions** | Staff (or Admin) can change availability; Customer portal available (second session/role) |
| **Test steps** | 1. Mark an item unavailable. 2. As Customer, confirm it cannot be ordered. 3. Restore availability. |
| **Expected result** | Change persists and Customer ordering reflects it. |
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
| **Preconditions** | Signed in as Staff |
| **Test steps** | 1. Click “Item Availability” in nav. 2. Confirm a working availability UI. |
| **Expected result** | Staff reach a functioning availability screen (not a 404). |
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
| **Requirement/feature** | FR-002 / FR-004 Login and Admin access |
| **Priority** | Must |
| **Preconditions** | Demo Admin or live Admin account |
| **Test steps** | 1. Sign in as Admin. 2. Open dashboard, orders, menu, reports, audit. |
| **Expected result** | Administrator management UI is accessible. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-ADM-002

| Field | Content |
|---|---|
| **ID** | UAT-ADM-002 |
| **Role** | Administrator |
| **Requirement/feature** | FR-013 Menu management |
| **Priority** | Must |
| **Preconditions** | Signed in as Admin |
| **Test steps** | 1. Create an item. 2. Edit name/price. 3. Remove or deactivate. 4. Check Customer menu. 5. Refresh the app. |
| **Expected result** | Create/update/remove persist and appear on the Customer catalogue where applicable. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-ADM-003

| Field | Content |
|---|---|
| **ID** | UAT-ADM-003 |
| **Role** | Administrator |
| **Requirement/feature** | FR-005 / FR-072 User management |
| **Priority** | Must |
| **Preconditions** | Signed in as Admin |
| **Test steps** | 1. Open Users from nav. 2. View accounts. 3. Change role or active flag. 4. Verify access impact. |
| **Expected result** | User/role and active-state changes persist and enforce access. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-ADM-004

| Field | Content |
|---|---|
| **ID** | UAT-ADM-004 |
| **Role** | Administrator |
| **Requirement/feature** | FR-070 Essential reports |
| **Priority** | Must |
| **Preconditions** | Signed in as Admin |
| **Test steps** | 1. Open `/reports` (and dashboard KPIs). 2. Apply a date/range filter if present. 3. Compare to known orders. |
| **Expected result** | Order counts/sales reflect authoritative data; empty ranges handled clearly. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-ADM-005

| Field | Content |
|---|---|
| **ID** | UAT-ADM-005 |
| **Role** | Administrator |
| **Requirement/feature** | FR-071 Audit logs |
| **Priority** | Must |
| **Preconditions** | Signed in as Admin |
| **Test steps** | 1. Perform a menu or user change. 2. Open `/audit-logs`. 3. Find a matching entry (actor, action, target, time). |
| **Expected result** | A new audit row exists for the action; UI is read-only. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-ADM-006

| Field | Content |
|---|---|
| **ID** | UAT-ADM-006 |
| **Role** | Customer (negative vs Admin) |
| **Requirement/feature** | FR-004 |
| **Priority** | Must |
| **Preconditions** | Signed in as Customer |
| **Test steps** | 1. Confirm Admin nav items hidden. 2. Direct-URL `/reports` and `/audit-logs`. |
| **Expected result** | Customer cannot use Administrator functions. |
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
| **Preconditions** | Two roles (or two sessions); preferably live shared data |
| **Test steps** | 1. Customer places Pickup order (Cash or Card). 2. Confirm **New**. 3. Staff finds **that** order. 4. Advance Confirmed → Preparing → ReadyForPickup → Completed. 5. Customer confirms each status. |
| **Expected result** | One persisted order; Staff and Customer see the same lifecycle. |
| **Actual result** | Not Run |
| **Status** | Not Run |
| **Evidence** | — |

---

### UAT-API-001

| Field | Content |
|---|---|
| **ID** | UAT-API-001 |
| **Role** | Admin / operator |
| **Requirement/feature** | Live API connectivity (not full MVP) |
| **Priority** | Must (integration smoke) |
| **Preconditions** | Backend running; URL known |
| **Test steps** | 1. Settings: enter URL, Test connection. 2. Save, sign in with **real** credentials. 3. Confirm orders/menu still or not live. |
| **Expected result** | `/health` succeeds; login uses API; tester records which screens still use mock data. |
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

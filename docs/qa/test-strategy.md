# BruvHub QA Test Strategy (Task 2)

**Role:** System Architect & Quality Assurance  
**Product:** BruvHub (UI/API still labelled StackedHub)  
**Baseline:** post-merge repository (frontend + `backend/StackedHub.*`) + architecture docs  
**Revision:** Pre-merge strategy assumed **no backend in repo** and unused `data.ts`. That is **historical**. Current strategy below.

**UAT execution:** **No UAT case has been run.** All 24 remain **Not Run**. Backend `dotnet test` existence does **not** mark UAT Passed.

---

## 1. Purpose

Verify Must-have MVP against **current** implementation. A route, DTO, or passing API test is not a UAT Pass.

---

## 2. QA objectives

Unchanged: Must journeys, demo vs live, RBAC, traceability, defects, automation awareness.

Added: treat **Customer portal vs Staff/Admin `data.ts` split** as the primary live-mode risk. Testers must record environment **and** which screens used mock vs API.

---

## 3. Scope

Must MVP table unchanged (Customer / Staff / Administrator (`Admin`)).

Extended domain (loyalty, promotions, CRM, AI, delivery channels) out of Must unless scope changes.

### In this repository now

- ASP.NET Core API, domain, EF/SQLite infrastructure, JWT/BCrypt
- Backend tests: `ApiFlowTests.cs`, `OrderLifecycleTests.cs`
- Staff/Admin Must UI via `data.ts` + `use-load.ts`
- Customer Must UI still largely mock

### Still not in repo

Frontend unit/e2e runner, CI test workflow.

---

## 4. Must MVP priority (post-merge)

1. Live Staff/Admin smoke on **`http://localhost:5032`** (queue, availability, users, reports, audit) — code is wired; **UAT Not Run**.
2. Customer portal integration: menu + `POST /api/orders` + tracking (DEF-002–004, 007).
3. Register UI (API exists).
4. VAL-001 acceptance before failing UAT-STA-004 solely on requirements status **names**.
5. Extended screens last.

---

## 5. Test levels / types

| Level | Current state |
|---|---|
| Static review | This pack + post-merge re-audit |
| Unit | **Backend:** `OrderLifecycleTests`. **Frontend:** none in `package.json` |
| Integration / API | **Backend:** `ApiFlowTests` (in-memory SQLite factory). **Browser↔API UAT:** Not Run |
| Functional / role / responsive | Not Run |
| UAT | 24 cases, all **Not Run** |
| Regression | Re-run Must UAT after portal wiring; `dotnet test` on API changes |

A feature is not Passed because `data.ts` or a controller exists.

---

## 6. Test environments

| Environment | Definition | Notes |
|---|---|---|
| **Demo** | No API URL | Staff/Admin: `data.ts` memory store. Portal: `mock-data`. Demo login: any password. |
| **Live API** | Base URL set | Use **`http://localhost:5032`**. README **5000** is wrong for current launchSettings. Staff/Admin: REST. **Portal menu/cart/place/history still mock.** |

Do not assume Settings “Connected to API” means the Customer Must path is live.

---

## 7–11. Entry / exit / severity / lifecycle / evidence

Unchanged in principle. Exit still requires **executed** UAT. Severity and DEF/VAL/RBV classes: `defect-register.md`.

Evidence for API automation: `dotnet test` output. Evidence for UAT: still required separately.

---

## 12. Automated testing (updated)

### Frontend

`package.json`: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`. No `test` script. No Vitest/Playwright/CI.

### Backend (`backend/StackedHub.Tests`)

Run (from backend solution, as documented by Role 2): `dotnet test StackedHub.sln`.

#### `OrderLifecycleTests.cs`

- Theory: Placed→InKitchen allowed; Placed→Completed forbidden; InKitchen→Ready; Ready→Completed; Completed→Cancelled forbidden.
- Customer cancel only while `Placed`.

Covers FR-031 **implemented** machine, not requirements New/Confirmed/…. Does not cover HTTP 409 or UI.

#### `ApiFlowTests.cs` (11 facts) — approximate Must mapping

| Test | Helps |
|---|---|
| `Menu_is_public_and_matches_frontend_catalogue` | FR-010/012 seed |
| `Demo_customer_can_login_and_place_pickup_order` | Login + API place Cash, status `Placed` |
| `Unavailable_item_cannot_be_ordered` | FR-026 API |
| `Staff_can_move_order_through_kitchen` | One step to In kitchen + queue contains order |
| `Customer_cannot_open_staff_or_customer_crm_routes` | API 403 |
| `Admin_can_read_frontend_contract_routes` | Admin smoke (includes non-Must CRM/inventory) |
| `Admin_can_patch_customer_note_and_see_active_users` | Partial users list |
| `Customer_checkout_can_set_channel` | Channel, not Pickup UI |
| Assistant / AI tests | **Not Must** |

**Must still untested by these files:** register; full chain to Completed + Customer UI tracking; invalid status **HTTP**; Staff vs `/api/admin/*`; payment on DTO; menu CRUD; user deactivate then login; **all UAT**.

---

## 13. Risks and dependencies

| Risk | Impact | Notes |
|---|---|---|
| Portal bypasses `data.ts` | E2E and DEF-002–004/007 | Highest Must risk |
| README :5000 vs API :5032 | False live-connect failures | RBV-004 |
| VAL-001 | UAT-STA-004/E2E name mismatch | Keep open |
| `getUsers` `active: true` | Wrong Active labels | DEF-014 |
| `OrderDto` omits payment | Cannot assert Cash/Card on tracking | DEF-015 |
| No menu DELETE | FR-013 incomplete | DEF-016 |
| Forgot-password stub | Looks implemented | RBV-005 |
| Demo password ignored | Demo UAT ≠ auth | DEF-009 |
| No frontend/CI tests | UI regressions | DEF-013 partial |
| CORS AllowAnyOrigin | Deploy risk | Flag only |

---

## 14. QA deliverables

| Deliverable | Status |
|---|---|
| This strategy / traceability / UAT / defects / architecture | Updated to post-merge; UAT **Not Run** |
| Backend automated tests | Present; not a substitute for UAT |
| Frontend automated tests / CI | Still absent |

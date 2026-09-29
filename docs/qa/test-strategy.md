# BruvHub QA Test Strategy (Task 2)

**Role:** System Architect & Quality Assurance  
**Product:** BruvHub (UI/API still labelled StackedHub)  
**Baseline:** post-merge repository (frontend + `backend/StackedHub.*`) + architecture docs  
**Revision:** Pre-merge strategy assumed **no backend in repo** and unused `data.ts`. That is **historical**. Current strategy below.

**UAT execution:** Live Staff 2026-09-29 on **`http://localhost:5032`** + frontend **`:8080`** (`VITE_API_BASE_URL` set). UAT-STA-003 **Pass** (queue load). UAT-STA-004 original **Fail** retained; **Pass on retest** (implemented lifecycle). UAT-E2E-001 **Blocked** (DEF-002). Remaining cases **Not Run**. `dotnet test` is **not** a UAT Pass by itself. DEF-017 **Resolved / Verified**. VAL-001 **Open**.

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

1. Live Staff/Admin smoke on **`http://localhost:5032`** — Staff queue + implemented status progression executed 2026-09-29. Remaining Staff/Admin (availability, Admin screens, invalid transitions) **Not Run**.
2. Customer portal integration: menu + `POST /api/orders` + tracking (DEF-002–004, 007).
3. Register UI (API exists).
4. VAL-001 acceptance — **still open**; do not treat implemented names as requirements New/Confirmed/Preparing/ReadyForPickup.
5. Extended screens last.

---

## 5. Test levels / types

| Level | Current state |
|---|---|
| Static review | This pack + post-merge re-audit |
| Unit | **Backend:** `OrderLifecycleTests`. **Frontend:** none in `package.json` |
| Integration / API | **Backend:** `ApiFlowTests` (in-memory SQLite factory). Live Staff browser↔API: queue + lifecycle retest executed. |
| Functional / role / responsive | Partial (Staff orders only) |
| UAT | 24 cases: **2 Pass**, **0 current Fail**, **1 Blocked**, **21 Not Run** |
| Regression | `dotnet test` after API changes; re-run Staff Accept if converters change; Must UAT after portal wiring |

A feature is not Passed because `data.ts` or a controller exists.

---

## 6. Test environments

| Environment | Definition | Notes |
|---|---|---|
| **Demo** | No API URL | Staff/Admin: `data.ts` memory store. Portal: `mock-data`. Demo login: any password. |
| **Live API** | Base URL set | Use **`http://localhost:5032`**. README **5000** is wrong for current launchSettings. Staff/Admin: REST. **Portal menu/cart/place/history still mock.** 2026-09-29: `GET /health` ok; Staff Jason Reid live login; queue live. **Isolation:** `dotnet test` on the shared dev DB grew the queue **9 → 13**. |

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

#### `ApiFlowTests.cs` (12 facts) — approximate Must mapping

| Test | Helps |
|---|---|
| `Menu_is_public_and_matches_frontend_catalogue` | FR-010/012 seed |
| `Demo_customer_can_login_and_place_pickup_order` | Login + API place Cash, status `Placed` |
| `Unavailable_item_cannot_be_ordered` | FR-026 API |
| `Staff_can_move_order_through_kitchen` | One step to In kitchen + queue contains order |
| `Staff_status_patch_accepts_frontend_in_kitchen_wire_value` | DEF-017 regression: Staff JWT, `PATCH /api/staff/orders/{id}/status`, literal `{"status":"In kitchen"}`. **Passes.** Not a substitute for UAT; manual retest also Passed. |
| `Customer_cannot_open_staff_or_customer_crm_routes` | API 403 |
| `Admin_can_read_frontend_contract_routes` | Admin smoke (includes non-Must CRM/inventory) |
| `Admin_can_patch_customer_note_and_see_active_users` | Partial users list |
| `Customer_checkout_can_set_channel` | Channel, not Pickup UI |
| Assistant / AI tests | **Not Must** |

**Must still untested by these files:** register; Customer UI tracking of a shared order; invalid status **HTTP**; Staff vs `/api/admin/*`; payment on DTO; menu CRUD; user deactivate then login. Automated suite after DEF-017: **18 passed, 0 failed, 0 skipped** (was 17/17 before the regression test). UAT is recorded separately — do not infer remaining UAT Pass from this suite. Shared-dev-DB runs contaminate the live Staff queue.

---

## 13. Risks and dependencies

| Risk | Impact | Notes |
|---|---|---|
| Portal bypasses `data.ts` | E2E and DEF-002–004/007 | Highest Must risk |
| README :5000 vs API :5032 | False live-connect failures | RBV-004 |
| VAL-001 | Requirements vs implemented lifecycle names | **Keep open** — runtime Pass used `Placed` / `In kitchen` / `Ready` / `Completed`, not New→Confirmed→Preparing→ReadyForPickup |
| Staff Accept JSON `"In kitchen"` | Live PATCH bind 400 | DEF-017 **Resolved / Verified** (converter order + 18/18 + manual retest) |
| Shared SQLite for `dotnet test` + live API | Queue 9 → 13 during UAT | Isolation observation, not a product DEF |
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
| This strategy / traceability / UAT / defects / architecture | Live Staff UAT recorded; STA-004 original Fail retained; DEF-017 Resolved / Verified; VAL-001 Open; E2E Blocked |
| Backend automated tests | Present; not a substitute for UAT |
| Frontend automated tests / CI | Still absent |

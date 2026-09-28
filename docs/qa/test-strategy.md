# BruvHub QA Test Strategy (Task 2)

**Role:** System Architect & Quality Assurance  
**Product:** BruvHub (repository UI still labelled StackedHub)  
**Baseline:** frontend repository + `docs/architecture/*`  
**Execution status:** **No tests have been run.** This document is a plan, not a results report.

---

## 1. Purpose

Define how Task 2 QA will verify Must-have MVP behaviour against the **current implementation**, without treating a route, type, or endpoint constant as a pass.

QA records gaps and mismatches; it does not rewrite application source as part of this documentation step.

---

## 2. QA objectives

1. Confirm whether Customer, Staff, and Administrator (`Admin`) Must MVP journeys actually work.
2. Separate **demo UI behaviour** from **live API behaviour**.
3. Verify role boundaries (positive and negative).
4. Trace each Must requirement to evidence (code inspection now; execution later).
5. Log defects/gaps with severity so the team can prioritise.
6. Prepare for later automated tests without claiming they exist today.

---

## 3. Scope

### In scope (Must MVP — highest priority)

| Role | Capabilities |
|---|---|
| Customer | Register/login, browse menu, add items, Pickup order, Cash/Card capture, confirmation, track current status |
| Staff | Login/role access, order queue, status updates, item availability |
| Administrator (`Admin`) | Login/role access, menu management, user management, essential reports, audit logs |

Also in scope: static review of this repo, UAT against demo mode, planned live-API checks when a backend is available.

### Out of scope unless formally added

Loyalty, promotions, CRM, delivery/third-party channels, inventory/recipes, AI recommendations, “Gemini insights”, full payment-gateway/PCI, production load testing.

### Not in this repository

No ASP.NET API, database, or CI test pipeline. Backend behaviour is **Requires Backend Verification**.

---

## 4. Must MVP priority order

1. Authentication (login; register if/when present).
2. Customer order path: menu → cart → Pickup + payment method → persisted order in **New**.
3. Staff queue + valid status transitions on the **same** order the Customer tracks.
4. Availability change visible to Customer ordering.
5. Administrator menu, users, reports, audit **with persistence**.
6. Authorization beyond hidden navigation.
7. Extended-domain screens last.

---

## 5. Test levels / types

| Level | How it will be used in Task 2 | Current state |
|---|---|---|
| **Static / repository review** | Code and architecture docs; classify Implemented / Partial / Missing | **Started** (this QA pack). Not a substitute for UAT. |
| **Unit testing** | Status machine, totals, `isLiveApi` / `apiRequest` errors | **Not configured** — no test runner in `package.json` |
| **Integration / API** | Login, health, staff/admin endpoints vs `docs/architecture/api-contract.md` | **Not run**; backend not in this repo |
| **Functional** | Each Must screen’s behaviour (demo, then live) | **Not run** |
| **Role / authorization** | Customer vs Staff vs `Admin`; unauthenticated access | **Not run**; frontend gate is client-side only (`AppShell`) |
| **Responsive / UI** | ~360px and ≥1024px on Must screens | **Not run** |
| **UAT** | Numbered cases in `uat-test-cases.md` | All **Not Run** |
| **Regression** | Re-run Must UAT after changes | **Not started** |

A feature is not Passed because `src/routes/*.tsx` or `endpoints.*` exists.

---

## 6. Test environments

| Environment | Definition | What QA can do now |
|---|---|---|
| **Demo** | No API base URL (`isLiveApi()` false). Sign-in via `src/lib/auth.tsx` demo users; pages seed `src/lib/mock-data.ts` / `useState`. | Manual UAT of UI. Persistence and live auth are out of this environment. |
| **Live API** | `stackedhub.apiUrl` or `VITE_API_BASE_URL` set. | Only login, `/health`, and AI are called from UI today. Other MVP screens still mock until routes use `src/lib/data.ts`. **Requires Backend Verification.** |

Testers must record which environment was used. Do not assume Settings “Connected to API” means orders/menu are live (`docs/architecture/api-contract.md`).

---

## 7. Entry criteria

- Application can be started (`npm run dev`) **or** source is available for static review.
- Role/status mapping known (`docs/architecture/domain-contract.md`).
- UAT cases and defect process exist (this pack).
- For live tests: API URL, test accounts, and backend owner available.

Features may enter QA independently (e.g. static review of register before UAT).

---

## 8. Exit criteria (Must feature)

A Must item is QA-complete only when:

- Relevant UAT (and API checks if live) have been **executed** and recorded.
- Behaviour matches the agreed requirement **or** an accepted defect/waiver exists.
- **Critical** defects for that item are closed.
- **High** defects are closed or formally accepted.
- Traceability row is updated from Not Tested / Partial / Missing as appropriate.

**Task 2 documentation complete ≠ product QA-complete.**

---

## 9. Severity

| Severity | Meaning |
|---|---|
| **Critical** | Must MVP journey cannot complete (e.g. no real order create); severe data/security failure; app unusable |
| **High** | Major Must requirement fails; no reasonable workaround |
| **Medium** | Partial failure, weak validation, or significant usability issue |
| **Low** | Cosmetic, wording, branding, or low-impact consistency |

---

## 10. Defect lifecycle

`Open` → `Assigned` → `In Progress` → `Ready for Retest` → `Closed`  
Failed retest: `Reopened`.

Classification (see `defect-register.md`):

| Class | Use for |
|---|---|
| **DEF** | Confirmed implementation defect/gap (evidence in this repo) |
| **VAL** | Architecture/requirements mismatch needing team validation — **not** a confirmed software bug |
| **RBV** | Needs backend or runtime proof |

---

## 11. Evidence expected

| Activity | Evidence |
|---|---|
| Static review | File path + short description |
| UAT | Status Not Run / Pass / Fail; notes; screenshot when executed |
| Live API | Request/response (sanitised), status codes |
| Later automation | Test runner output — **none today** |
| Defects | ID, severity, evidence path, requirement impact |

---

## 12. Current limitation — no automated test framework

`package.json` scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.

There is **no** `test` script, **no** Vitest/Jest/Playwright/Cypress/Testing Library dependency, **no** `*.test.*` / `*.spec.*` files, and **no** CI test workflow in this repository.

QA therefore starts with **static review + planned UAT**. Unit/e2e automation is a later deliverable, not a current capability.

---

## 13. Risks and dependencies

| Risk | Impact | Dependency |
|---|---|---|
| Routes ignore `src/lib/data.ts` | Live UAT of orders/menu/users/reports/audit cannot pass even with an API | Frontend wiring decision (ADR-002) |
| Status names differ from requirements | Lifecycle UAT blocked or false Fail | VAL mapping (`domain-contract.md` §5) |
| No order-create / Pickup / payment in client | Customer Must path cannot pass | Frontend + backend contract |
| Client-only `AppShell` RBAC | Negative auth tests on UI ≠ server security | Backend authorization (RBV) |
| Backend not in this repo | Integration untested | Backend teammate / `StackedHub.Api` |
| Demo login ignores password | Auth UAT in demo is not credential testing | Live environment |
| Nav 404s (`/users`, `/availability`) | Staff/Admin Must screens unreachable from nav | Frontend routes |

---

## 14. QA deliverables (Task 2)

| Deliverable | File | Status |
|---|---|---|
| Test strategy | `docs/qa/test-strategy.md` | This document |
| Traceability | `docs/qa/requirements-traceability.md` | Planned + static status; **not executed** |
| UAT cases | `docs/qa/uat-test-cases.md` | Written; all **Not Run** |
| Defect register | `docs/qa/defect-register.md` | Static findings logged; no runtime UAT yet |
| Architecture baseline | `docs/architecture/*.md` | Complete (separate work) |
| Automated tests | — | **Not started** |

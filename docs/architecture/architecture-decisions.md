# BruvHub Architecture Decision Register

**Project:** BruvHub (running identifiers still StackedHub / Stacked Foods)  
**Scope:** Task 2  
**Revision:** Post-merge update. Pre-merge ADRs described a frontend-only repo with unused `data.ts`. That was accurate **then**. Current baseline includes `backend/StackedHub.*` in this repository.

| Status | Meaning |
|---|---|
| **Baseline recorded** | Describes what the repository does now. Not a consultant sign-off of requirements. |
| **Working principle** | Architecture direction for this task; large code changes still need team confirmation. |
| **Pending validation** | Unresolved; do not treat as approved equivalence. |
| **Implementation gap** | Requirements expect behaviour not fully provided in the product UI and/or API. |
| **Superseded (context)** | Earlier context is historical; decision still stands or is updated below. |

Do not treat items as client **approved** unless recorded later. VAL-001 is **not** approved.

---

## ADR-001 — Preserve the existing repository baseline

**Status:** Working principle (context updated)

### Pre-merge context (historical)

The repo was a TanStack Start frontend, mock screens, unused `data.ts`, and an **external** API assumption.

### Post-merge context

The same frontend remains. This repository now also contains:

- `backend/StackedHub.Api` — ASP.NET Core REST, JWT, Swagger
- `backend/StackedHub.Domain` — entities, `OrderLifecycle`, enums
- `backend/StackedHub.Infrastructure` — EF Core, seeder, SQLite/SQL
- `backend/StackedHub.Tests` — `ApiFlowTests`, `OrderLifecycleTests`

### Decision

Keep this tree as the Task 2 baseline. Extend existing modules (`data.ts`, `api-client.ts`, portal, API) rather than rebuilding.

---

## ADR-002 — Preserve the demo / live API abstraction

**Status:** Baseline recorded — **Customer wiring still pending**

### Post-merge

`isLiveApi()` + `api-client.ts` remain the switch. `data.ts` is **in use** for Staff/Admin Must screens via `use-load.ts`.

**Customer portal still does not use `data.ts`.** Live badge can be true while Customer menu/orders stay on `mock-data.ts`.

### Decision

Retain demo/live split. Complete the abstraction by putting Customer Must (menu, place order, track) on the same path.

QA must record **per screen** whether demo store or API was used. Do not assume README “live mode” covers the portal.

---

## ADR-003 — Use the shared API client

**Status:** Working principle

New live calls go through `apiRequest` / `endpoints`. Settings may keep raw `fetch` for `/health`.

**Gap:** backend `POST /api/orders` and `GET /api/orders` exist; they are **not** in `endpoints`. Adding them (when the portal is wired) should go through this client.

Backend JSON: camelCase, `OrderStatusJsonConverter` (`"In kitchen"`), JWT Bearer.

---

## ADR-004 — Role model and Administrator / Admin naming

**Status:** **Accepted implementation mapping** (VAL-002)

Frontend `Role` and backend `UserRole` both use `Admin`, not `Administrator`. JWT matches.

- Requirements name: Administrator  
- Implementation value: `Admin`  
- **Do not rename code.**

---

## ADR-005 — Order lifecycle vs requirements lifecycle

**Status:** **Pending validation (VAL-001 remains open)**

Frontend and backend now **share** `Placed → In kitchen → Ready → Completed` (+ `Cancelled`). `OrderLifecycleTests` asserts that machine.

Requirements remain `New → Confirmed → Preparing → ReadyForPickup → Completed`. There is still **no Confirmed**.

**Do not** treat the implemented machine as equivalent without consultant/team acceptance. Do not rename enums in this documentation pass.

---

## ADR-006 — Must-have MVP vs extended-domain features

**Status:** Working principle (unchanged)

Must: Customer auth/menu/pickup order/track; Staff queue/status/availability; Admin menu/users/reports/audit.

Present but **not** automatically Must: loyalty, promotions, CRM UI, delivery channels, inventory extras, AI/Gemini, assistant.

Backend implements several extended APIs; frontend CRM/promotions remain mock. That does not complete Must.

---

## ADR-007 — Legacy StackedHub / Stacked Foods naming

**Status:** Baseline recorded — cleanup/debt

Unchanged: package `tanstack_start_ts`, UI StackedHub, `@stackedfoods.co.za`, `stackedhub.*` keys, API title StackedHub. Rebrand is not a Must blocker (VAL-003).

---

## ADR-008 — Automated testing baseline

**Status:** Partially closed for **backend**; still a gap for **frontend/CI**

### Pre-merge (historical)

No test runner in `package.json`; no tests in repo.

### Post-merge

| Layer | State |
|---|---|
| Backend | `dotnet test` via `StackedHub.Tests`: `ApiFlowTests.cs`, `OrderLifecycleTests.cs` |
| Frontend `package.json` | Still `dev` / `build` / `lint` / `format` only — **no** `test` script |
| CI | No GitHub Actions (or similar) test workflow found |
| UAT | All cases **Not Run** |

Backend coverage and Must gaps: see `docs/qa/test-strategy.md` §12.

---

## ADR-009 — Source-control safety (Lovable)

**Status:** Baseline recorded (`AGENTS.md`)

No force-push / rewrite of published history. This documentation update is not a commit unless the team requests one.

---

## ADR-010 — Post-merge system shape (new)

**Status:** Baseline recorded

```
Browser (TanStack Start)
  ├─ Portal (Customer Must) ── mock-data  [gap]
  ├─ Staff/Admin Must ── data.ts / use-load ──► demo store OR REST
  └─ Auth / Settings / AI ── api-client
                              │
                    StackedHub.Api (JWT, ~:5032)
                              │
                    Domain + EF (Infrastructure)
```

Authorization: UI hide + **API role checks**. CORS currently `AllowAnyOrigin` (campus demo risk if deployed widely).

---

## Open architecture questions

Resolved since pre-merge (no longer blockers to *knowing* the answer):

- Backend is **in this repo** (`StackedHub.Api`).
- Live login returns `Admin` (not `Administrator`).
- `/users` and `/availability` **exist**.
- API **does** enforce roles; `AppShell` is still UX-only.
- Staff/Admin screens **do** use `data.ts`.

Still open:

1. When will the **Customer portal** use `data.ts` / `POST /api/orders` / `GET /api/orders`?
2. VAL-001: accept implemented statuses as the external lifecycle, or change later?
3. Should `OrderDto` expose `paymentMethod` for tracking/reports?
4. Menu **DELETE** (or deactivate-only policy)?
5. Align README **5000** vs launch **5032** (docs/QA; README not edited in this pass).

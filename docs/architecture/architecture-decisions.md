# BruvHub Architecture Decision Register

**Project:** BruvHub (repository still branded StackedHub in UI/package metadata)  
**Scope:** Task 2 — decisions recorded from the current frontend baseline  
**How to read statuses**

| Status | Meaning |
|---|---|
| **Baseline recorded** | Describes what this repository already does. Not a consultant sign-off. |
| **Working principle** | Direction from System Architecture for this task; still needs team confirmation before large code changes. |
| **Pending validation** | Unresolved; do not implement a breaking change until confirmed. |
| **Implementation gap** | Requirements expect behaviour that this repository does not yet provide. |

Do not treat any item below as client/consultant **approved** unless that approval is recorded later.

---

## ADR-001 — Preserve the existing repository baseline

**Status:** Working principle

### Context

This repository is a TanStack Start / React frontend with mock-driven screens, an unused data-access module (`src/lib/data.ts`), and an optional `fetch` client for an external ASP.NET API that is **not** in this repo.

Rebuilding the app would discard working UI, routing, and the existing integration seam.

### Decision

Keep the current repository as the Task 2 implementation baseline. Extend or wire existing modules rather than replacing the project.

### Consequence

Architecture and QA document gaps instead of rewriting pages for naming or structure alone.

---

## ADR-002 — Preserve the demo / live API abstraction

**Status:** Baseline recorded — wiring **pending validation**

### Context

`src/lib/api-client.ts` defines `isLiveApi()`, base URL resolution, and JWT attachment.  
`src/lib/data.ts` is written to call the live API when configured, otherwise an in-memory copy of mock data.

Routes currently import `src/lib/mock-data.ts` (and local `useState`) instead of `data.ts`. Live mode therefore does not drive most screens.

### Decision

Retain the demo/live split (`isLiveApi()` + `api-client`). Do not delete `data.ts` as dead code until the team confirms the intended data flow.

### Required follow-up

Confirm whether all MVP screens should consume `data.ts` (or equivalent) so demo and live share one path. Until then, QA must test **actual** data sources per screen, not README claims.

---

## ADR-003 — Use the shared API client

**Status:** Working principle

### Context

`src/lib/api-client.ts` is the documented single integration point (`apiRequest`, `endpoints`, `tokenStore`). Settings health check uses raw `fetch` to `/health` (same `endpoints.health` path). Portal AI and live login use `apiRequest`.

### Decision

New live HTTP calls should go through `apiRequest` / `endpoints` rather than adding a second client. The existing Settings `fetch` for health may remain as a connectivity probe.

### Consequence

Endpoint paths stay centralised in `endpoints`. Backend schema for those paths is **to be verified against backend implementation.**

---

## ADR-004 — Role model and Administrator / Admin naming

**Status:** Baseline recorded; requirements mapping **pending validation** only if a rename is proposed

### Context

Requirements roles: Customer, Staff, Administrator.  
Implemented: `"Admin" | "Staff" | "Customer"` (`src/lib/types.ts`).

### Decision

- Canonical **requirements** name remains Administrator.
- Canonical **implementation** value remains `Admin`.
- Mapping: Administrator ≡ `Admin`.
- Do **not** rename the type or UI labels solely for terminology.

### QA implication

Authorization tests use the implemented value `Admin`. Documents may say Administrator (`Admin`).

---

## ADR-005 — Order lifecycle vs requirements lifecycle

**Status:** Pending validation (reconciliation required)

### Context

Requirements: `New → Confirmed → Preparing → ReadyForPickup → Completed` (+ `Cancelled`).

Implemented (`src/lib/types.ts`, `src/routes/orders.tsx`):

`Placed → In kitchen → Ready → Completed` (+ `Cancelled`).

There is no `Confirmed` analogue. `data.ts` `updateOrderStatus` sends whatever `OrderStatus` the frontend type allows.

### Decision

Record both models. Do **not** change implemented status strings in this step.

A provisional mapping is in `docs/architecture/domain-contract.md` §5. It is **not** approved.

### QA implication

Until reconciliation, automated/UAT checks against the current UI must use implemented statuses. Requirements-level transition tests remain blocked on an agreed mapping or backend contract.

---

## ADR-006 — Must-have MVP vs extended-domain features

**Status:** Working principle

### Must-have MVP (requirements)

| Role | Capabilities |
|---|---|
| Customer | Authenticate (register/login), browse menu, place **pickup** order, track order |
| Staff | Order queue, process/update orders, item availability |
| Administrator (`Admin`) | Menu management, user management, essential reports, audit logs |

### Present in this repository but **not** automatically MVP

Loyalty points, promotions, customers CRM, delivery/third-party channels (`Uber Eats`, `Mr D`, `WhatsApp`), stock/low-stock inventory, AI meal recommendations (`/api/ai/recommendations`), “Gemini insights” dashboard copy.

### Decision

Architecture and QA prioritise Must-have MVP. Extended features may remain in the UI; they do not count as MVP completion and must not block core order/auth work.

---

## ADR-007 — Legacy StackedHub / Stacked Foods naming

**Status:** Baseline recorded — cleanup/debt, not an immediate refactor

### Evidence in this repository

- Package name: `tanstack_start_ts` (`package.json`)
- UI product name: StackedHub
- Demo emails: `@stackedfoods.co.za`
- `localStorage` keys: `stackedhub.user`, `stackedhub.jwt`, `stackedhub.apiUrl`
- `api-client.ts` comment: ASP.NET Core API / `StackedHub.Api`
- README: “StackedHub Go Frontend”

### Decision

Treat BruvHub / Bruv Burger as the requirements product name. Leave running identifiers in place. Rebrand is technical debt, not a Task 2 blocker, unless the client requires it.

---

## ADR-008 — Automated testing baseline

**Status:** Implementation gap (factual, from `package.json`)

### Context

Scripts present: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.

No `test` or `typecheck` script. No Vitest/Jest/Playwright/Cypress/Testing Library dependencies. No `*.test.*` / `*.spec.*` files. No CI workflow in this repository.

### Decision

The current automated testing baseline is **lint + production build only**. Behavioural coverage is a QA gap to be added later by agreement — not assumed to exist.

---

## ADR-009 — Source-control safety (Lovable)

**Status:** Baseline recorded (`AGENTS.md`)

### Context

`AGENTS.md` states this project is connected to Lovable. Force-pushing or rewriting published git history (rebase/amend/squash of already-pushed commits) can lose history on Lovable’s side. Pushed commits on the connected branch sync back to the Lovable editor.

### Decision

Follow `AGENTS.md`: no history rewrites of published commits; keep the connected branch in a working state. Architecture documentation changes should be normal forward commits when the team requests them (this documentation task does not itself commit).

---

## Open architecture questions

These require team/backend/consultant input before implementation changes:

1. Will `src/lib/data.ts` become the single data path for orders, menu, users, reports and audit, or will routes keep mock/`useState`?
2. What is the agreed order-status mapping (or will the backend adopt frontend strings, or vice versa)?
3. Where is Customer **register** and **order create** (including Pickup and Cash/Card)? No create-order path exists in `endpoints`.
4. Will authorization be enforced on the API, given `AppShell` is client-only?
5. Are `/users` and `/availability` (linked in `AppShell`, no route files) planned pages or obsolete nav?
6. Does live login return `role: "Admin"` or `"Administrator"`? Frontend types expect `Admin`.
7. Is the ASP.NET API in a separate repository/branch (`StackedHub.Api` comment) the Task 2 backend of record?

Until these are answered, treat live API mode as **partially wired** (login, health, AI) and domain lifecycle alignment as **unresolved**.

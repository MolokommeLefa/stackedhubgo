# StackedHub — Role 2 backend and database

This is the **INSY7315 Phase 2 Role 2** deliverable: the database, REST API, JWT authentication, Swagger docs, automated tests, and a Gemini meal assistant with a no-key fallback.

The Lovable / Vite UI in `src/` is Role 1. This API is built so that UI can call it when `VITE_API_BASE_URL` (or the Settings page address) is set.

Open **`StackedHub.sln`** in Visual Studio 2022. Start-up project: **`StackedHub.Api`**. Browser: `/swagger`.

Do **not** force-push or rebase GitHub `main` — that repo is connected to Lovable.

---

## What this backend does

StackedHub is the operations layer for **Stacked Foods** (pickup restaurant). This API:

1. Stores users, menu, orders, promotions, and audit rows.
2. Lets customers register, sign in, browse the menu, and place a **pickup** order.
3. Lets staff move an order **Placed → In kitchen → Ready → Completed** (or Cancelled).
4. Lets admin manage menu items, user activation, promotions, reports, and the audit log.
5. Recommends meals from the live menu (Gemini when a key is present; otherwise a grounded fallback).

Payment is **Cash or Card method capture** at collection. There is no card gateway. Uber Eats / Mr D / WhatsApp exist as **channel labels** on an order, not as live integrations.

---

## Solution layout

```
StackedHub.sln
backend/
  StackedHub.Domain/            C# entities, enums, order status rules
  StackedHub.Infrastructure/    EF Core DbContext, SQL Server / SQLite, seed data
  StackedHub.Api/               HTTP host, JWT, controllers, Swagger, Gemini client
  StackedHub.Tests/             xUnit + WebApplicationFactory
docs/ROLE-2.md                  this file
```

| Project | Responsibility |
| --- | --- |
| **Domain** | `User`, `MenuItem`, `Order`, `OrderItem`, `Promotion`, `AuditLog`. Status machine in `OrderLifecycle`. No database or HTTP. |
| **Infrastructure** | `AppDbContext` maps those types to tables. `DbSeeder` fills demo users, menu, orders, promotions, and audit rows. Chooses SQL Server LocalDB or SQLite. |
| **Api** | `Program.cs` hosts Kestrel, CORS, JWT Bearer, Swagger. Controllers expose `/api/...`. Services hold checkout, tokens, reports, and AI. |
| **Tests** | Hits a throwaway SQLite file through the real pipeline: login, pickup, RBAC, stock PATCH, AI fallback. |

Requests flow: **HTTP → controller (role check) → service / DbContext → SQLite or LocalDB → JSON DTO**.

---

## How to run it

### Visual Studio 2022 (Windows)

1. Workload: **ASP.NET and web development**.
2. SQL Server LocalDB (installed with VS) **or** set `"UseSqlite": true` in `backend/StackedHub.Api/appsettings.json`.
3. Set `StackedHub.Api` as the start-up project and press F5.
4. Swagger opens at `/swagger`. Root `/` redirects there. `GET /health` returns `{ "status": "ok" }`.

Default LocalDB connection:

```
Server=(localdb)\mssqllocaldb;Database=StackedHub;Trusted_Connection=True;TrustServerCertificate=true
```

### Command line

```bash
dotnet test StackedHub.sln
dotnet run --project backend/StackedHub.Api --urls http://127.0.0.1:5032
```

On **Linux** the API uses SQLite (`stackedhub.db`) because LocalDB is Windows-only.

### Point the front end at it (Role 1)

```
VITE_API_BASE_URL=http://127.0.0.1:5032
```

Or paste that URL on the Settings page (stored in `localStorage`). Until an address is set, the UI uses bundled mock data.

### Optional Gemini

```
Gemini__ApiKey=your-key
```

Empty key is valid: recommendations still return from the menu.

### Git hygiene

Commit `StackedHub.sln`. Do **not** ignore `*.sln`. Ignore `bin/`, `obj/`, `*.db`, `*.db-shm`, `*.db-wal`. Do not commit `backend/**/bin` or a local `stackedhub.db`.

---

## Demo accounts

Password for all seeded users: **`Stacked123!`**

| Role | Email |
| --- | --- |
| Customer | `priya.nair@example.co.za` |
| Staff | `jason@stackedfoods.co.za` |
| Admin | `thandi@stackedfoods.co.za` |

Also seeded (same password): customers Marcus Bell, Elena Costa, Sipho Dlamini, Aisha Patel; extra staff Nomsa Khumalo. Menu, promotions, and sample orders follow the front-end `src/lib/mock-data.ts` catalogue.

---

## Database

`AppDbContext` owns these tables:

| Table | Purpose |
| --- | --- |
| **Users** | Email (unique), BCrypt password hash, name, phone, note, role (`Customer` / `Staff` / `Admin`), `IsActive`, loyalty points. |
| **MenuItems** | Name, description, category (Mains / Sides / Drinks / Desserts), price, stock, low-stock threshold, spicy, available. |
| **Orders** | Reference (`#4821`), customer, optional staff, status, channel, payment method, total, placed-at, special instructions. |
| **OrderItems** | Snapshot of name, quantity, unit price, subtotal, menu item id. |
| **Promotions** | Title, description, percent off, start/end, active, redemptions. |
| **AuditLogs** | Actor user id, action, entity, details, timestamp. |

`EnsureCreated()` runs on start. `DbSeeder.Seed` runs only when `Users` is empty.

IDs are **ints** in EF and **strings** in JSON (`"1"`, `"2"`) so the Vite app never has to parse numbers.

Statuses and channels are stored with the UI labels (`In kitchen`, `In-store`, `Mobile app`, `Uber Eats`, `Mr D`).

---

## Authentication and roles

`TokenService` issues a 12-hour JWT (HMAC-SHA256). Claims: user id (`sub`), email, role, name.

Send it as:

```
Authorization: Bearer <token>
```

Swagger: **Authorize** → paste the token.

| Role | Can |
| --- | --- |
| **Customer** | Register/login, read menu, place pickup order, list own orders, cancel while **Placed**, ask the assistant / AI. |
| **Staff** | Kitchen board, status moves, inventory / availability, customer list and notes. |
| **Admin** | Everything staff can, plus users, create/update menu, promotions, reports, audit log. |

Deactivated users (`IsActive = false`) get **403** on login. Customer cannot open staff or admin routes (**403**).

Passwords are hashed with **BCrypt**. JWT key, issuer, and audience live in `appsettings.json` (`Jwt:Key` must be at least 32 characters).

---

## Order lifecycle

```
Placed  →  In kitchen  →  Ready  →  Completed
    \          |            |
     \         v            v
      +---- Cancelled <----+
```

- Staff/Admin may only move **one step** along that path, or cancel before Completed.
- Customers may cancel **only while Placed** (`POST /api/orders/{id}/cancel`).
- Completed and Cancelled are terminal.
- Completing an order adds loyalty points: `floor(total / 10)`.

Implemented in `StackedHub.Domain/OrderLifecycle.cs` and enforced by `OrderService`.

Checkout (`POST /api/orders`):

- Caller must be a Customer (id from the JWT, not from the body).
- Each line must exist, be `available`, and have enough `stock`.
- Stock is decremented; stock `0` forces `available: false`.
- Default channel is `Website`; the body may send `channel` (`WhatsApp`, `In-store`, and so on).
- Default payment is **Cash** if omitted. **Card** is stored as the collection method only.

---

## JSON contract

- CamelCase properties (`customerName`, `placedAt`, `loyaltyPoints`).
- Enums as strings. Order status **`In kitchen`** (space, not `InKitchen`).
- Channels: `In-store`, `Website`, `Mobile app`, `Uber Eats`, `Mr D`, `WhatsApp`.
- Roles: `Admin`, `Staff`, `Customer`.
- User objects include **`active`** (boolean).
- Inventory PATCH may send `{ "stock": 12 }` **without** `available`. Missing `available` does not flip the item to unavailable. Stock `0` still marks it unavailable.

Converters: `JsonLabels.cs` (`OrderStatusJsonConverter`, `OrderChannelJsonConverter`).

---

## HTTP surface

Public (no token): `GET /health`, `GET /`, Swagger, `GET /api/menu`, `GET /api/promotions`, `POST /api/auth/*` (except `me`), `POST /api/ai/recommendations`, `POST /api/assistant`.

### Auth — `AuthController`

| Method | Path | Who | Body / result |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | `{ email, password, name? }` → `{ token, user }` (role Customer) |
| POST | `/api/auth/login` | public | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/forgot-password` | public | `{ email }` → always 200; no email is sent |
| GET | `/api/auth/me` | any signed-in user | current `user` |

### Menu — `MenuController`

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/menu` | public |
| GET | `/api/menu/{id}` | public |

Each item: `id`, `name`, `description`, `category`, `price`, `stock`, `lowStockThreshold`, `spicy`, `available`.

### Orders — `OrdersController`

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/orders` | Customer: own orders. Staff/Admin: full board (optional `?status=`) |
| GET | `/api/orders/{id}` | owner, or Staff/Admin |
| POST | `/api/orders` | Customer | `{ items: [{ menuItemId, quantity }], channel?, paymentMethod? }` |
| PATCH/PUT | `/api/orders/{id}/status` | Staff/Admin | `{ status: "In kitchen" }` |
| POST | `/api/orders/{id}/cancel` | Customer (Placed only) |

### Staff aliases — `StaffController`

| Method | Path |
| --- | --- |
| GET | `/api/staff/orders` |
| PATCH | `/api/staff/orders/{id}/status` |
| PATCH | `/api/staff/menu/{id}/availability` | `{ available }` and/or `{ stock }` |

Role 1 tries `/api/orders` first, then these aliases.

### Inventory — `InventoryController`

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/inventory` | Staff/Admin |
| PATCH | `/api/inventory/{id}` | `{ stock? , available? }` |

### Customers — `CustomersController`

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/customers` | Staff/Admin. Spend/orders derived from non-cancelled orders. Tier from loyalty (VIP ≥ 400, Regular ≥ 100). |
| PATCH | `/api/customers/{id}` | `{ note }` |

### Promotions — `PromotionsController`

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/promotions` | public |
| POST | `/api/promotions` | Admin | title, description, discountPercent, startsAt, endsAt |
| PATCH | `/api/promotions/{id}` | Admin | `{ active }` (omit to toggle) |

### Admin — `AdminController`

| Method | Path |
| --- | --- |
| GET | `/api/admin/users` | users including `active` |
| PATCH | `/api/admin/users/{id}` | `{ isActive }` or `{ active }` |
| POST | `/api/admin/menu` | create item |
| PUT | `/api/admin/menu/{id}` | full update |
| GET | `/api/admin/reports` | same payload as `/api/reports` |
| GET | `/api/admin/audit` | same as `/api/audit-logs` |

### Reports and audit

| Method | Path | Who | Payload |
| --- | --- | --- | --- |
| GET | `/api/reports` | Admin | `orderCount`, `completedSales`, `hourlyOrders`, `revenueByDay`, `bestSellers`, `salesByChannel` |
| GET | `/api/audit-logs` | Admin | `id`, `actor`, `role`, `action`, `target`, `at` |

### AI

| Method | Path | Result |
| --- | --- | --- |
| POST | `/api/ai/recommendations` | **Array** `[{ name, reason, menuItemId }]` — what the portal expects |
| POST | `/api/assistant` | `{ reply, topic, source, actions }` FAQ + live menu |

---

## Working components (code)

### Domain (`backend/StackedHub.Domain`)

- **`User`** — identity, role, loyalty, CRM note. `Name` is `FirstName + LastName` (not mapped as a column).
- **`MenuItem`** — sellable row with stock and availability.
- **`Order` / `OrderItem`** — pickup ticket and line snapshot (price is copied at checkout so later menu edits do not rewrite history).
- **`Promotion`** — campaign window and redemptions.
- **`AuditLog`** — who did what (actor stored as `AdminId`, but staff may write rows too).
- **`OrderLifecycle`** — allowed status moves.

### Infrastructure (`backend/StackedHub.Infrastructure`)

- **`AppDbContext`** — indexes, string conversions, relationships (customer restrict-delete, staff set-null).
- **`DependencyInjection.AddStackedHubData`** — SQL Server unless Linux, `UseSqlite=true`, or the connection string looks like SQLite (`Data Source=`).
- **`DbSeeder`** — demo password `Stacked123!`, Stacked Foods menu, sample board orders `#4816`–`#4821`.

### API host (`backend/StackedHub.Api`)

- **`Program.cs`** — JSON options, Swagger + Bearer, CORS `AllowAnyOrigin` (Vite), JWT, `EnsureCreated` + seed, `/health`.
- **`TokenService`** — builds the JWT.
- **`OrderService`** — transactional checkout, queues, status updates, loyalty on complete.
- **`ReportService`** — customer CRM rows and report aggregates.
- **`RecommendationService`** — Gemini `generateContent` (8s timeout). On missing key or HTTP failure: spicy / dessert / budget / default top items from available stock.
- **`AssistantService`** — keyword FAQ (hours, pickup, payment, tracking, loyalty) plus “is X available / how much”.
- **`Mapping`** — entity → DTO (string ids, `active`, customer tier).
- **`Helpers/Ids`** — user id from `sub` or `NameIdentifier`.
- **`Helpers/MenuStock`** — inventory PATCH: only change `available` when the client sent it.

### Tests (`backend/StackedHub.Tests`)

- **`OrderLifecycleTests`** — status machine unit tests.
- **`ApiFlowTests`** — in-memory SQLite host: public menu, Priya pickup, sold-out rejection, staff kitchen move, admin CRM routes, inventory stock PATCH, customer note, channel on checkout, AI fallback without a Gemini key, customer forbidden on staff routes.

```bash
dotnet test StackedHub.sln
```

---

## Configuration

`backend/StackedHub.Api/appsettings.json`:

| Key | Meaning |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | LocalDB on Windows |
| `UseSqlite` | Force SQLite even on Windows |
| `Jwt:Key` / `Issuer` / `Audience` | Token signing |
| `Gemini:ApiKey` / `Gemini:Model` | Optional; default model `gemini-2.0-flash` |

Environment overrides use double underscore, e.g. `Gemini__ApiKey`, `Jwt__Key`.

CORS is open for local Vite. Do not use `AllowAnyOrigin` as-is in production (Role 4).

---

## How to try it in Swagger

1. `POST /api/auth/login` with Priya’s email and `Stacked123!`. Copy `token`.
2. **Authorize** → Bearer token.
3. `GET /api/menu`, `GET /api/orders`, `POST /api/ai/recommendations` with `{ "prompt": "something spicy" }`.
4. Log in as Jason and `PATCH /api/orders/{id}/status` with `{ "status": "In kitchen" }`.
5. Log in as Thandi for `/api/reports`, `/api/customers`, `/api/admin/users`.

---

## What this role does not own

| Role | Still theirs |
| --- | --- |
| **1 — Front-end** | Screens, branding, wiring `VITE_API_BASE_URL` / Settings. This API does not change Lovable pages. Role 1 currently maps every admin user to `active: true` in `data.ts`; they should use the `active` field the API now returns. |
| **3 — QA** | Test plan, E2E, CI. Plug in `dotnet test StackedHub.sln`. |
| **4 — DevOps** | Hosting, GitHub Actions, DNS, production secrets. |

Out of the whole-team Must-have MVP: delivery checkout, PCI gateway, live Uber Eats / Mr D APIs, Android app.

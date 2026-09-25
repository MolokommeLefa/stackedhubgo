# StackedHub — Role 2 (Back-End & Database)

This branch adds the **INSY7315 Phase 2 Role 2** ASP.NET Core 8 Web API next to the Lovable/Vite front end. Role 2 owns the schema, REST contract, JWT, tests, Swagger, and the Gemini meal assistant (with a menu-grounded fallback so the demo still runs without an API key).

Open **`StackedHub.sln`** in Visual Studio 2022. Start-up project: `StackedHub.Api`. Swagger: `/swagger`.

Do **not** force-push or rebase `main` — this repo is connected to Lovable.

## Front-end contract (`src/lib/api-client.ts`)

| Front-end endpoint | Role | Notes |
| --- | --- | --- |
| `POST /api/auth/login` | public | JWT + `{ id, name, email, role, loyaltyPoints? }` |
| `POST /api/auth/register` | public | Customer accounts. Email + password are enough; optional `name` / `firstName` / `lastName`. |
| `POST /api/auth/forgot-password` | public | Always 200; no email is sent in the prototype. |
| `GET /api/auth/me` | any signed-in user | |
| `GET /api/menu` | public | String ids, `stock`, `spicy`, `available` |
| `GET/POST /api/orders` | Customer posts; Staff/Admin list the board | Pickup only |
| `PATCH /api/orders/{id}/status` | Staff/Admin | `Placed` → `In kitchen` → `Ready` → `Completed` |
| `GET /api/inventory` + `PATCH /api/inventory/{id}` | Staff/Admin | Stock / availability |
| `GET /api/customers` | Staff/Admin | Loyalty tier, spend, notes |
| `GET /api/promotions` | public | `POST` / `PATCH` Admin |
| `GET /api/reports` | Admin | Hourly orders, revenue, best sellers, channels |
| `GET /api/audit-logs` | Admin | |
| `POST /api/ai/recommendations` | public | Body `{ prompt }`. Returns `[{ name, reason, menuItemId }]` |

Extra Role 2 routes (not in the front-end map, still useful in Swagger): `POST /api/orders/{id}/cancel`, `GET /api/staff/orders`, `PATCH /api/staff/menu/{id}/availability`, `POST /api/admin/menu`, `POST /api/assistant`.

JSON uses **string ids**. EF Core still stores ints. Enums serialize as the front-end labels (`"In kitchen"`, `"In-store"`, `"Admin"`).

### Must-have MVP (Role 2 freeze)

- Pickup orders only. Cash/Card is **method capture**, not a card gateway.
- No Uber Eats / Mr D sync as Must-have (those values exist as `channel` labels only).
- No Android app in this slice.

### Demo users (password `Stacked123!`)

| Role | Email |
| --- | --- |
| Customer | `priya.nair@example.co.za` |
| Staff | `jason@stackedfoods.co.za` |
| Admin | `thandi@stackedfoods.co.za` |

Extra seeded customers (`marcus.bell@example.co.za`, `elena.costa@example.co.za`, `sipho.dlamini@example.co.za`, `aisha.patel@example.co.za`) use the same password so CRM screens have data.

Menu, promotions, and sample orders follow `src/lib/mock-data.ts`.

## AI

`POST /api/ai/recommendations` calls **Google Gemini** when `Gemini:ApiKey` (or env `Gemini__ApiKey`) is set. If the key is missing or Gemini fails, the API returns menu-grounded suggestions (spicy / dessert / budget filters). The customer portal already expects a JSON **array** of `{ name, reason }`.

`POST /api/assistant` is a second, FAQ-style helper that answers from live menu rows and a fixed pickup/payment/status list.

## Run in Visual Studio (Windows)

1. Workload: **ASP.NET and web development**
2. SQL Server LocalDB (ships with VS) **or** set `"UseSqlite": true` in `backend/StackedHub.Api/appsettings.json`
3. Set `StackedHub.Api` as StartUp project and press F5

Default LocalDB connection:

`Server=(localdb)\\mssqllocaldb;Database=StackedHub;Trusted_Connection=True;TrustServerCertificate=true`

On Linux the API automatically uses SQLite (`stackedhub.db`) because LocalDB is Windows-only.

```bash
dotnet test StackedHub.sln
dotnet run --project backend/StackedHub.Api --urls http://127.0.0.1:5032
```

Point the Vite app at the API (Role 1 wiring):

```
VITE_API_BASE_URL=http://127.0.0.1:5032
```

Optional Gemini key:

```
Gemini__ApiKey=your-key
```

## Outstanding work (not Role 2)

### Role 1 — Project Lead & Front-End

- Branding, remaining UI polish, loading/error states
- Switching sign-in / orders / portal off mock data when `VITE_API_BASE_URL` is set
- This branch does **not** change Lovable screens

### Role 3 — System Architect & QA

- Test plan, extra E2E, GitHub administration
- Plug `dotnet test StackedHub.sln` into CI

### Role 4 — DevOps & Deployment

- Host API + SQL + website
- GitHub Actions, DNS, monitoring

### Out of MVP for the whole team

- Delivery checkout as Must-have
- PCI payment-gateway settlement
- Live Uber Eats / Mr D sync
- Android app

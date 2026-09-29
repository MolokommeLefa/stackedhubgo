# StackedHub — demo script (working prototype)

**Duration:** 8–10 minutes. **Due:** 5 Oct 2026.

## Prep

1. Frontend: `npm install` then `npm run dev` (usually `http://localhost:5173`).
2. Optional live API: run Role 2 `dotnet run --project backend/StackedHub.Api --urls http://127.0.0.1:5032`, then Settings → save that URL.
3. If no API: stay in demo mode (any password).

## Test accounts (password `Stacked123!`)

| Role | Email |
| --- | --- |
| Admin | thandi@stackedfoods.co.za |
| Staff | jason@stackedfoods.co.za |
| Customer | priya.nair@example.co.za |

## Walkthrough

1. **Sign in (Staff)** — role tabs, error if wrong details on live API, busy button disabled.
2. **Orders** — filter, move Placed → In kitchen → Ready → Completed, empty filter state.
3. **Availability (Staff)** — toggle items on/off the menu.
4. Sign out. **Sign in (Admin)** — dashboard KPIs, menu catalogue, users, reports CSV, audit log.
5. **Register** a new customer (demo: stored locally; live: Role 2 register).
6. **Forgot password** — always succeeds with a clear message (prototype does not send email).
7. **Customer portal** — add to cart, place order, empty cart copy, AI prompt (demo or `/api/ai/recommendations`).
8. **Settings** — profile, API URL, test connection, sign out.
9. Resize to phone width — bottom/horizontal nav still works.

## If something fails

- Demo mode: Settings → clear API URL → Save.
- Live mode: “Can’t reach the API” → retry after Role 2 starts the host.

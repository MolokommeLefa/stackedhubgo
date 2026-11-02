<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Cursor Cloud specific instructions

- Frontend checks match CI: Node 22, `npm test`, then `npm run build`. Dev server: `npm run dev -- --host 0.0.0.0 --port 5173`.
- API checks: .NET 8, `dotnet test StackedHub.sln`. Dev server: `dotnet run --project backend/StackedHub.Api --no-launch-profile` on port 5032. Health is `/health`; Swagger is `/swagger`.
- `appsettings.json` points at SQL Server LocalDB. On Linux that server is not installed. Set `UseSqlite=true` and `ConnectionStrings__DefaultConnection=Data Source=/tmp/stackedhub/stackedhub.db` before starting the API. Startup then creates the SQLite file and seeds demo accounts (password `Stacked123!`, for example `priya.nair@example.co.za`).
- The Vite app stays in demo mode until `VITE_API_BASE_URL` is set (for local API work, `http://127.0.0.1:5032`). An existing process environment variable overrides `.env`. The sign-in page should read "Using the live API" and the app shell "Connected to API".

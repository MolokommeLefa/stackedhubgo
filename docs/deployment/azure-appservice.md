# Deploying the StackedHub API to Azure App Service

## Current state

The Azure App Service `stackedhub-api-eufvdfc5duhwcpe4.southafricanorth-01.azurewebsites.net`
is deployed but every request returns **HTTP 500.30 — ASP.NET Core app failed to start**.
The process crashes during startup, before any endpoint (including `/health`) can answer.

### Why it crashes

`StackedHub.Api/appsettings.json` ships with a development default connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=StackedHub;..."
}
```

`Program.cs` runs `DatabaseInitializer.Apply(db)` at startup, which calls
`Database.Migrate()` / `EnsureCreated()`. LocalDB **does not exist on Azure App
Service**, so the first database call throws and the process exits — Azure reports 500.30.

The same crash would occur if the connection string were set but the database server
was unreachable (e.g. firewall), so always confirm with the log stream after fixing.

## Fix: configure Azure SQL and override the connection string

1. **Create (or reuse) an Azure SQL Database.** The free/cheapest tier is enough for a
   student project. Note the server name, database name, admin login and password.

2. **Allow the App Service through the firewall.** On the SQL server → *Networking* →
   enable **"Allow Azure services and resources to access this server"**.

3. **Add the connection string as an App Service setting** so it overrides
   `appsettings.json`. App Service → *Environment variables* (or *Configuration* →
   *Application settings* for older portals) → add:

   | Name | Value |
   |---|---|
   | `ConnectionStrings__DefaultConnection` | `Server=tcp:<server>.database.windows.net,1433;Database=<database>;User ID=<admin>;Password=<password>;Encrypt=true;TrustServerCertificate=true;Connection Timeout=30;` |

   Double underscores (`__`) in the name map to the nested `:` section in .NET
   configuration. Keep `TrustServerCertificate=true` — Microsoft.Data.SqlClient 4+
   defaults to encrypted connections and certificate validation fails on Azure SQL.

4. **Recommended settings while you are there:**

   | Name | Value | Why |
   |---|---|---|
   | `ASPNETCORE_ENVIRONMENT` | `Production` | Hides Swagger in production |
   | `Jwt__Key` | a strong secret of 32+ characters | The dev key is in source control |
   | `Gemini__ApiKey` | the Gemini key (optional) | Only needed for AI meal recommendations |

   Note: with `ASPNETCORE_ENVIRONMENT=Production`, Swagger is still served because
   `Program.cs` calls `app.UseSwagger()` unconditionally. If Swagger should be
   dev-only, wrap those two lines in `if (app.Environment.IsDevelopment())` —
   that is a code change for the backend owner to decide on.

## See the real error

Azure Portal → the App Service → **Log stream** (or *Diagnose and solve problems*).
Enable *App Service logs → Application logging* first if the stream is empty.
The first exception on startup will name the failing step (almost always the
SQL connection). Kudu console at `https://<app>.scm.azurewebsites.net` also helps.

## Redeploy after configuring

```bash
cd backend/StackedHub.Api
dotnet publish -c Release -o ./publish
# then deploy ./publish via VS Code Azure extension, GitHub Actions, or:
az webapp deploy --resource-group <rg> --name stackedhub-api-eufvdfc5duhwcpe4 \
  --src-path ./publish --type zip --async
```

If deploying with GitHub Actions, settings added in the portal persist across deploys.

## Verify

1. `curl https://stackedhub-api-eufvdfc5duhwcpe4.southafricanorth-01.azurewebsites.net/health`
   must return `{"status":"ok"}`.
2. In the web app, open **Settings → API connection** (the hosted address is
   pre-filled) and click **Test connection** — it should show
   "The API answered — you're good to go."
3. Sign in with a seeded account, e.g. `thandi@stackedfoods.co.za` /
   `Stacked123!` (created by `DbSeeder`).

## Notes

- CORS is already permissive (`AllowAnyOrigin`), so the browser frontend at
  localhost or `*.lovable.app` will work once the API starts.
- If the App Service has *Always On* disabled, the first request after idle may be
  slow (cold start) but should no longer crash once the connection string is fixed.

# Deploying Shikho English

This guide covers running the backend against a hosted PostgreSQL database on Supabase and
publishing the frontend. Supabase is used **only as the database**: the ASP.NET Core backend is
the only thing that talks to it, so Supabase Auth, Storage and the Data API are not used.

## 1. Create the Supabase database

1. Create a Supabase project and choose a strong database password.
2. In **Project Settings → Data API**, turn the Data API off if you can. This app never uses it.
   Either way, step 4 locks the tables away from it.
3. In **Connect**, copy a connection string:
   - **Session pooler (port 5432)** is the recommended choice for both the backend and migrations.
   - **Direct connection** also works if your backend host supports IPv6.
   - Avoid the **transaction pooler (port 6543)**. It does not keep session state between
     statements, which EF Core migrations and some Npgsql features rely on.

   Convert it to the Npgsql format and add `SSL Mode=Require`:

   ```
   Host=<pooler host>;Port=5432;Database=postgres;Username=postgres.<project ref>;Password=<password>;SSL Mode=Require
   ```

   Outside Development the backend refuses to start with a remote connection string that does not
   require SSL.

## 2. Generate and review the database SQL

Migrations are never applied automatically outside Development. Generate the SQL instead:

```powershell
./scripts/New-MigrationScript.ps1
```

This writes two files to `artifacts/` (ignored by git):

| File | What it does |
| --- | --- |
| `migrate.sql` | Every migration, each wrapped so it only runs if it has not been applied yet. Safe to run on a new or partly migrated database. |
| `supabase-lockdown.sql` | Enables row level security on every table and revokes the Data API roles (`anon`, `authenticated`). |

Read `migrate.sql` before applying it. The `CaseInsensitiveUniqueEmail` migration stops with a
list of emails if two accounts differ only by letter case; resolve those by hand and run it again.

## 3. Apply the SQL

Run both files as the `postgres` user, in order, either in the Supabase **SQL Editor** or with psql:

```bash
psql "<connection string in URI form>" -f artifacts/migrate.sql
psql "<connection string in URI form>" -f artifacts/supabase-lockdown.sql
```

Run `supabase-lockdown.sql` again after every release that adds tables. It is safe to run repeatedly.

## 4. Configure and run the backend

Set these environment variables on the backend host (see `Backend/.env.example`):

| Variable | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | The connection string from step 1 |
| `Jwt__Secret` | A new random value of at least 32 bytes (never reuse the development secret) |
| `Ai__Provider` | `Gemini` (default) or `OpenAI` |
| `Ai__Gemini__ApiKey` | Your Gemini API key (or `Ai__OpenAI__ApiKey` when using OpenAI) |
| `Cors__AllowedOrigins` | The frontend's URL, e.g. `https://shikho-english.example.com` |
| `RateLimiting__AiRequestsPerMinute` | Optional, default 20 per student |
| `RateLimiting__AuthRequestsPerMinute` | Optional, default 30 per IP address |

The backend refuses to start if a required secret is missing or unsafe, if `Database__MigrateOnStartup`
is set, or if the database connection is not encrypted.

Point the host's health probe at `GET /health`. It returns `Healthy` (200) when the database is
reachable and `Unhealthy` (503) otherwise.

### Behind a proxy or load balancer

Login and registration limits are counted per client IP address. If the host puts a proxy in front
of the app, every request appears to come from the proxy, so all students would share one limit.
In that case configure ASP.NET Core forwarded headers for your host's proxy addresses before going
live (this is not set up yet, because it depends on the host).

## 5. Build and publish the frontend

```bash
cd frontend
npm ci
VITE_API_BASE_URL=https://<backend host>/api npm run build
```

Upload `frontend/dist/` to any static host and configure it to serve `index.html` for unknown
paths, so links such as `/questions/12` work. Only `VITE_*` variables reach the browser, and they
are public: never put keys there.

## 6. Check the deployment

1. `GET /health` returns `Healthy`.
2. `GET /api/topics` returns 11 topics.
3. Register a test account in the frontend, analyse a question and open History.
4. In Supabase, confirm the Data API cannot read the tables: a request with the project's anon key
   to `/rest/v1/Users` must fail.

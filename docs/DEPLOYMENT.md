# Deploying Shikho English

This guide covers running the backend against a hosted PostgreSQL database on Supabase and
publishing the frontend. Supabase is used **only as the database**: the ASP.NET Core backend is
the only thing that talks to it, so Supabase Auth, Storage and the Data API are not used.

## 1. Create the Supabase database

1. Create a Supabase project and choose a strong database password.
2. In **Project Settings → Data API**, turn the Data API off if you can. This app never uses it.
   Either way, step 3 locks the tables away from it.
3. In **Connect**, copy a connection string:
   - **Session pooler (port 5432)** is the recommended choice for both the backend and migrations.
   - **Direct connection** also works if your backend host supports IPv6.
   - Avoid the **transaction pooler (port 6543)**. It does not keep session state between
     statements, which EF Core migrations and some Npgsql features rely on.

4. Download the CA certificate: **Project Settings → Database → SSL Configuration → Download
   certificate**. Save it as `certs/supabase-ca.crt` in the repository root (the `certs/` folder is
   not committed). On a server, put it anywhere and use its full path.
5. Convert the connection string to the Npgsql `Host=...;` format (not the `postgresql://` URI) and
   verify the server's certificate:

   ```
   Host=<pooler host>;Port=5432;Database=postgres;Username=postgres.<project ref>;Password=<password>;SSL Mode=VerifyFull;Root Certificate=certs/supabase-ca.crt
   ```

   A relative `Root Certificate` path is resolved from the repository root.

The backend checks the connection string at startup:

| Rule | Development | Other environments |
| --- | --- | --- |
| Remote database must use SSL | ✅ required | ✅ required |
| Server certificate must be verified (`VerifyFull` or `VerifyCA`) | `Require` allowed | ✅ required (`Require` cannot stop a man-in-the-middle) |
| `Root Certificate` file must exist | ✅ | ✅ |
| `Database:MigrateOnStartup` | local databases only | never |

If the session pooler rejects `VerifyFull` (certificate name mismatch), use the **direct connection**
host (`db.<project ref>.supabase.co`) with `VerifyFull`, or `VerifyCA`, which checks the certificate
authority but not the host name. Do not fall back to `Require` outside Development.

### The SUPABASE_* settings (recommended)

Instead of writing the whole connection string, fill in the separate settings in the root `.env` and
leave `ConnectionStrings__DefaultConnection` empty. The backend builds the session-pooler connection
(user `postgres.<project ref>`) from them:

| Setting | Where to find it |
| --- | --- |
| `SUPABASE_PROJECT_REF` | Project Settings → General → Project ID |
| `SUPABASE_POOLER_HOST` | Connect → Session pooler → host (e.g. `aws-0-ap-south-1.pooler.supabase.com`) |
| `SUPABASE_DB_PASSWORD` | Project Settings → Database (put it in single quotes if it contains `#` or `$`) |
| `SUPABASE_DB_PORT` / `SUPABASE_DB_NAME` | `5432` / `postgres` |
| `SUPABASE_SSL_MODE` / `SUPABASE_CA_CERT` | `Require` locally; `VerifyFull` with `certs/supabase-ca.crt` on servers |

The direct connection host (`db.<project ref>.supabase.co`) only has an IPv6 address, so it does not
work from networks without IPv6; the session pooler works everywhere.

### Using Supabase for local development

Keep `Database__MigrateOnStartup=false` in `.env`: Development normally migrates the database at
startup, but the backend refuses to do that to a remote database. Apply migrations to Supabase with
the reviewed SQL from step 2 instead. Everything you do locally then changes the shared Supabase data.

## 2. Generate and review the database SQL

Migrations are never applied automatically to a remote database. Generate the SQL instead:

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

Give the backend the same settings as the repository's `.env.example`, in one of three ways:

- a filled-in `.env` file in the app's folder (or any parent folder), readable only by the app's user;
- a `.env` file anywhere, with the environment variable `SHIKHO_ENV_FILE` set to its full path;
- the host's own environment-variable settings (these win over any `.env`).

Set `ASPNETCORE_ENVIRONMENT=Production` on the server. The most important settings:

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
is set, or if the database connection is not encrypted with a verified certificate (`VerifyFull`/`VerifyCA`).
Copy `certs/supabase-ca.crt` to the server too and point `Root Certificate` at it.

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

PowerShell: `$env:VITE_API_BASE_URL = "https://<backend host>/api"; npm run build`. Setting the variable
like this overrides the value in the repository's `.env` for that build.

Upload `frontend/dist/` to any static host and configure it to serve `index.html` for unknown
paths, so links such as `/questions/12` work. Only `VITE_*` variables reach the browser, and they
are public: never put keys there.

## 6. Check the deployment

1. `GET /health` returns `Healthy`.
2. `GET /api/topics` returns 11 topics.
3. Register a test account in the frontend, analyse a question and open History.
4. In Supabase, confirm the Data API cannot read the tables: a request with the project's anon key
   to `/rest/v1/Users` must fail.

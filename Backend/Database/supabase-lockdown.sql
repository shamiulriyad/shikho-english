-- Shikho English: keep the application's tables out of Supabase's public Data API.
--
-- Supabase exposes tables in the "public" schema through its REST/GraphQL Data API to the
-- "anon" and "authenticated" roles. This app never uses that API: only the ASP.NET Core
-- backend talks to the database, connecting as the table owner. This script:
--   1. enables row level security (with no policies) on every table in "public", so the
--      Data API roles can read nothing even if privileges are granted again later;
--   2. revokes the Data API roles' privileges on existing tables and sequences;
--   3. stops new tables created by the current role from granting them privileges.
-- The owner role bypasses RLS (it is not FORCEd), so the backend keeps working.
--
-- Safe to run more than once. Run it as the role the migrations run as (normally "postgres"),
-- after applying migrations, and again after any migration that adds tables.

DO $$
DECLARE
    app_table record;
BEGIN
    FOR app_table IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', app_table.tablename);
    END LOOP;
END $$;

DO $$
DECLARE
    api_role text;
BEGIN
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
            EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
            EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', api_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', api_role);
        END IF;
    END LOOP;
END $$;

using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Tests.Integration;

/// <summary>
/// Runs Backend/Database/supabase-lockdown.sql against a database set up like Supabase's:
/// "anon" and "authenticated" roles that are granted access to new tables by default.
/// </summary>
[Collection(PostgresCollection.Name)]
public class SupabaseLockdownTests
{
    private readonly PostgresFixture _postgres;

    public SupabaseLockdownTests(PostgresFixture postgres)
    {
        _postgres = postgres;
    }

    private static string LockdownSql()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory != null && !File.Exists(Path.Combine(directory.FullName, "learnEnglish.sln")))
            directory = directory.Parent;
        return File.ReadAllText(Path.Combine(directory!.FullName, "Backend", "Database", "supabase-lockdown.sql"));
    }

    private static async Task SimulateSupabaseRoles(DbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
            END $$;
            GRANT USAGE ON SCHEMA public TO anon, authenticated;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
            """);
    }

    /// <summary>Runs a query as a Data API role; returns the PostgreSQL error code, or null if it succeeded.</summary>
    private static async Task<string?> QueryAs(string connectionString, string role, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        try
        {
            await using (var setRole = new NpgsqlCommand($"SET LOCAL ROLE {role}", connection, transaction))
                await setRole.ExecuteNonQueryAsync();
            await using var command = new NpgsqlCommand(sql, connection, transaction);
            await command.ExecuteNonQueryAsync();
            return null;
        }
        catch (PostgresException ex)
        {
            return ex.SqlState;
        }
        finally
        {
            await transaction.RollbackAsync();
        }
    }

    [Fact]
    public async Task LocksOutTheDataApiRoles_WhileTheAppKeepsWorking()
    {
        var connectionString = _postgres.NewDatabaseConnectionString();
        await using var db = PostgresFixture.CreateContext(connectionString);
        await db.Database.MigrateAsync();
        await SimulateSupabaseRoles(db);
        // Supabase grants also apply to tables that already exist
        await db.Database.ExecuteSqlRawAsync("GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;");

        // Before: the public API roles can read user data
        Assert.Null(await QueryAs(connectionString, "anon", """SELECT * FROM "Users" """));

        await db.Database.ExecuteSqlRawAsync(LockdownSql());
        await db.Database.ExecuteSqlRawAsync(LockdownSql()); // safe to run twice

        foreach (var role in new[] { "anon", "authenticated" })
        {
            Assert.Equal(PostgresErrorCodes.InsufficientPrivilege, await QueryAs(connectionString, role, """SELECT * FROM "Users" """));
            Assert.Equal(PostgresErrorCodes.InsufficientPrivilege, await QueryAs(connectionString, role, """SELECT * FROM "QuestionAnalyses" """));
            Assert.Equal(PostgresErrorCodes.InsufficientPrivilege,
                await QueryAs(connectionString, role, """INSERT INTO "GrammarTopics" ("Id", "Code", "NameEn", "NameBn", "SortOrder") VALUES (99, 'x', 'x', 'x', 99)"""));
        }

        // Every table has row level security on, without FORCE, so the owner (the app) is unaffected
        var unprotected = await db.Database.SqlQueryRaw<string>(
            """SELECT c.relname AS "Value" FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity""").ToListAsync();
        Assert.Empty(unprotected);

        db.Users.Add(new User { Email = "app@example.com", Username = "app", PasswordHash = "h", FullName = "App" });
        await db.SaveChangesAsync();
        Assert.Equal(1, await db.Users.CountAsync());
        Assert.Equal(GrammarTopicSeed.All.Length, await db.GrammarTopics.CountAsync());
    }

    [Fact]
    public async Task TablesCreatedLater_AreNotGrantedToTheDataApiRoles()
    {
        var connectionString = _postgres.NewDatabaseConnectionString();
        await using var db = PostgresFixture.CreateContext(connectionString);
        await db.Database.MigrateAsync();
        await SimulateSupabaseRoles(db);

        await db.Database.ExecuteSqlRawAsync(LockdownSql());
        await db.Database.ExecuteSqlRawAsync("""CREATE TABLE "FutureFeature" ("Id" integer PRIMARY KEY)""");

        Assert.Equal(PostgresErrorCodes.InsufficientPrivilege, await QueryAs(connectionString, "anon", """SELECT * FROM "FutureFeature" """));
    }
}

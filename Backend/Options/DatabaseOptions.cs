using Microsoft.Extensions.Options;
using Npgsql;

namespace Backend.Options
{
    public class DatabaseOptions
    {
        public const string SectionName = "Database";

        // Bound from ConnectionStrings:DefaultConnection
        public string ConnectionString { get; set; } = string.Empty;

        public bool MigrateOnStartup { get; set; }

        // Problems found while building the connection string from the SUPABASE_* settings
        public List<string> SetupErrors { get; } = new();

        /// <summary>
        /// Makes a relative "Root Certificate" path (e.g. certs/supabase-ca.crt) relative to the repository root,
        /// so it works no matter which folder the backend is started from.
        /// </summary>
        public static string ResolveCertificatePath(string connectionString, string repositoryRoot)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                return connectionString;

            NpgsqlConnectionStringBuilder builder;
            try
            {
                builder = new NpgsqlConnectionStringBuilder(connectionString);
            }
            catch (ArgumentException)
            {
                return connectionString; // reported by the validator
            }

            if (string.IsNullOrWhiteSpace(builder.RootCertificate) || Path.IsPathRooted(builder.RootCertificate))
                return connectionString;

            builder.RootCertificate = Path.GetFullPath(Path.Combine(repositoryRoot, builder.RootCertificate));
            return builder.ConnectionString;
        }

        public static bool IsLocalHost(NpgsqlConnectionStringBuilder builder)
        {
            var hosts = (builder.Host ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return hosts.Length > 0 && hosts.All(host => host is "localhost" or "127.0.0.1" or "::1" || host.StartsWith('/'));
        }
    }

    public class DatabaseOptionsValidator : IValidateOptions<DatabaseOptions>
    {
        private readonly IHostEnvironment _environment;

        public DatabaseOptionsValidator(IHostEnvironment environment)
        {
            _environment = environment;
        }

        public ValidateOptionsResult Validate(string? name, DatabaseOptions options)
        {
            var failures = new List<string>();

            if (options.SetupErrors.Count > 0)
            {
                failures.AddRange(options.SetupErrors);
            }
            else if (string.IsNullOrWhiteSpace(options.ConnectionString))
            {
                failures.Add("No database configured. In the repository's .env file fill in the SUPABASE_* settings, or set ConnectionStrings__DefaultConnection (for example a local database).");
            }
            else if (options.ConnectionString.Contains("://"))
            {
                // Supabase shows a postgresql://user:password@host:port/db link; Npgsql needs the key=value form
                failures.Add("ConnectionStrings:DefaultConnection contains a postgresql:// link. Use the Host=<host>;Port=5432;Database=postgres;Username=<user>;Password=<password>;SSL Mode=VerifyFull;Root Certificate=certs/supabase-ca.crt format instead (see .env.example).");
            }
            else
            {
                ValidateConnection(options, failures);
            }

            // Migrating on startup races between instances and applies unreviewed schema changes, so only allow it locally
            if (options.MigrateOnStartup && !_environment.IsDevelopment())
                failures.Add("Database:MigrateOnStartup is only allowed in Development. Apply a reviewed migration script ('dotnet ef migrations script --idempotent') instead.");

            return failures.Count > 0 ? ValidateOptionsResult.Fail(failures) : ValidateOptionsResult.Success;
        }

        private void ValidateConnection(DatabaseOptions options, List<string> failures)
        {
            NpgsqlConnectionStringBuilder builder;
            try
            {
                builder = new NpgsqlConnectionStringBuilder(options.ConnectionString);
            }
            catch (ArgumentException)
            {
                failures.Add("ConnectionStrings:DefaultConnection is not a valid PostgreSQL connection string.");
                return;
            }

            if (!string.IsNullOrWhiteSpace(builder.RootCertificate) && !File.Exists(builder.RootCertificate))
                failures.Add($"The Root Certificate file in ConnectionStrings:DefaultConnection was not found: {builder.RootCertificate}");

            if (DatabaseOptions.IsLocalHost(builder))
                return;

            // A hosted database (such as Supabase) is reached over the internet, so the connection must be encrypted...
            if (builder.SslMode is SslMode.Disable or SslMode.Allow or SslMode.Prefer)
                failures.Add("ConnectionStrings:DefaultConnection must use 'SSL Mode=VerifyFull' (or at least 'SSL Mode=Require' in Development) for a remote database.");
            // ...and outside Development the server's certificate must be checked, or a man-in-the-middle could read everything
            else if (builder.SslMode == SslMode.Require && !_environment.IsDevelopment())
                failures.Add("ConnectionStrings:DefaultConnection must use 'SSL Mode=VerifyFull' with 'Root Certificate=<CA file>' for a remote database outside Development.");

            // Remote databases are migrated only with reviewed scripts, never automatically
            if (options.MigrateOnStartup)
                failures.Add("Database:MigrateOnStartup only works with a local database. For a remote database (such as Supabase) set Database__MigrateOnStartup=false in .env and apply a reviewed script (scripts/New-MigrationScript.ps1).");
        }
    }
}

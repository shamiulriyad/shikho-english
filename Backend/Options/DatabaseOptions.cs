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

            if (string.IsNullOrWhiteSpace(options.ConnectionString))
                failures.Add("ConnectionStrings:DefaultConnection is not configured. Use 'dotnet user-secrets' in Development or the ConnectionStrings__DefaultConnection environment variable elsewhere.");
            else if (!_environment.IsDevelopment())
                ValidateTransportSecurity(options.ConnectionString, failures);

            // Migrating on startup races between instances and applies unreviewed schema changes, so only allow it locally
            if (options.MigrateOnStartup && !_environment.IsDevelopment())
                failures.Add("Database:MigrateOnStartup is only allowed in Development. Apply a reviewed migration script ('dotnet ef migrations script --idempotent') instead.");

            return failures.Count > 0 ? ValidateOptionsResult.Fail(failures) : ValidateOptionsResult.Success;
        }

        // A hosted database (such as Supabase) is reached over the internet, so the connection must be encrypted
        private static void ValidateTransportSecurity(string connectionString, List<string> failures)
        {
            NpgsqlConnectionStringBuilder builder;
            try
            {
                builder = new NpgsqlConnectionStringBuilder(connectionString);
            }
            catch (ArgumentException)
            {
                failures.Add("ConnectionStrings:DefaultConnection is not a valid PostgreSQL connection string.");
                return;
            }

            var hosts = (builder.Host ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var isLocal = hosts.Length > 0 && hosts.All(host => host is "localhost" or "127.0.0.1" or "::1" || host.StartsWith('/'));
            if (!isLocal && builder.SslMode is SslMode.Disable or SslMode.Allow or SslMode.Prefer)
                failures.Add("ConnectionStrings:DefaultConnection must use 'SSL Mode=Require' (or VerifyCA/VerifyFull) for a remote database.");
        }
    }
}

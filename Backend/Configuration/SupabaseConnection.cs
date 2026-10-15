using Npgsql;

namespace Backend.Configuration
{
    /// <summary>
    /// Builds the database connection string from the separate SUPABASE_* settings in .env,
    /// so each value can be copied from the Supabase dashboard on its own.
    /// Uses the session pooler, which works over IPv4 (the direct db.&lt;ref&gt;.supabase.co host is IPv6-only).
    /// </summary>
    public static class SupabaseConnection
    {
        public const string ProjectRefKey = "SUPABASE_PROJECT_REF";
        public const string PoolerHostKey = "SUPABASE_POOLER_HOST";
        public const string PasswordKey = "SUPABASE_DB_PASSWORD";
        public const string PortKey = "SUPABASE_DB_PORT";
        public const string DatabaseKey = "SUPABASE_DB_NAME";
        public const string SslModeKey = "SUPABASE_SSL_MODE";
        public const string CaCertificateKey = "SUPABASE_CA_CERT";

        /// <summary>True when any Supabase setting is filled in.</summary>
        public static bool IsConfigured(IConfiguration configuration) =>
            new[] { ProjectRefKey, PoolerHostKey, PasswordKey }.Any(key => !string.IsNullOrWhiteSpace(configuration[key]));

        /// <summary>
        /// Returns the connection string, or the list of settings still missing.
        /// </summary>
        public static (string? ConnectionString, List<string> Missing) Build(IConfiguration configuration)
        {
            var missing = new List<string>();
            string Required(string key, string whereToFindIt)
            {
                var value = configuration[key]?.Trim();
                if (string.IsNullOrEmpty(value))
                    missing.Add($"{key} ({whereToFindIt})");
                return value ?? string.Empty;
            }

            var projectRef = Required(ProjectRefKey, "Supabase -> Project Settings -> General -> Project ID");
            var host = Required(PoolerHostKey, "Supabase -> Connect -> Session pooler -> host");
            var password = Required(PasswordKey, "Supabase -> Project Settings -> Database -> database password");

            var sslModeText = configuration[SslModeKey]?.Trim();
            var sslMode = SslMode.Require;
            if (!string.IsNullOrEmpty(sslModeText) && !Enum.TryParse(sslModeText, ignoreCase: true, out sslMode))
                missing.Add($"{SslModeKey} (must be Require, VerifyCA or VerifyFull)");

            if (host.Contains("://") || host.Contains('@'))
                missing.Add($"{PoolerHostKey} (only the host name, e.g. aws-0-ap-south-1.pooler.supabase.com, not a postgresql:// link)");

            if (missing.Count > 0)
                return (null, missing);

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = int.TryParse(configuration[PortKey], out var port) ? port : 5432,
                Database = string.IsNullOrWhiteSpace(configuration[DatabaseKey]) ? "postgres" : configuration[DatabaseKey]!.Trim(),
                // The pooler identifies the project from the user name
                Username = $"postgres.{projectRef}",
                Password = password,
                SslMode = sslMode
            };

            var certificate = configuration[CaCertificateKey]?.Trim();
            if (sslMode is SslMode.VerifyCA or SslMode.VerifyFull && !string.IsNullOrEmpty(certificate))
                builder.RootCertificate = certificate;

            return (builder.ConnectionString, missing);
        }
    }
}

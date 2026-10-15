using Microsoft.Extensions.Diagnostics.HealthChecks;
using Backend.Data;

namespace Backend.Middleware
{
    /// <summary>Reports whether the database is reachable. Used by /health for hosting probes.</summary>
    public class DatabaseHealthCheck : IHealthCheck
    {
        private readonly AppDbContext _db;

        public DatabaseHealthCheck(AppDbContext db)
        {
            _db = db;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            return await _db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database unreachable");
        }
    }
}

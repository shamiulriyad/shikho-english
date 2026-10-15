using Microsoft.Extensions.Options;

namespace Backend.Options
{
    public static class RateLimitPolicies
    {
        /// <summary>Endpoints that call the AI, limited per student to control cost.</summary>
        public const string Ai = "ai";

        /// <summary>Login and registration, limited per IP address to slow password guessing.</summary>
        public const string Auth = "auth";
    }

    public class RateLimitingOptions
    {
        public const string SectionName = "RateLimiting";

        public int AiRequestsPerMinute { get; set; } = 20;

        // Students at one school or behind mobile carrier NAT can share an IP address, so keep this generous
        public int AuthRequestsPerMinute { get; set; } = 30;
    }

    public class RateLimitingOptionsValidator : IValidateOptions<RateLimitingOptions>
    {
        public ValidateOptionsResult Validate(string? name, RateLimitingOptions options)
        {
            var failures = new List<string>();
            if (options.AiRequestsPerMinute < 1)
                failures.Add("RateLimiting:AiRequestsPerMinute must be at least 1.");
            if (options.AuthRequestsPerMinute < 1)
                failures.Add("RateLimiting:AuthRequestsPerMinute must be at least 1.");
            return failures.Count > 0 ? ValidateOptionsResult.Fail(failures) : ValidateOptionsResult.Success;
        }
    }
}

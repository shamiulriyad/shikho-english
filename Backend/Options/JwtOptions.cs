using System.Text;
using Microsoft.Extensions.Options;

namespace Backend.Options
{
    public class JwtOptions
    {
        public const string SectionName = "Jwt";
        public const int MinimumSecretBytes = 32;

        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpiryMinutes { get; set; } = 60;
    }

    public class JwtOptionsValidator : IValidateOptions<JwtOptions>
    {
        // These values were committed to the repository, so anyone can sign tokens with them
        private static readonly string[] PublishedPlaceholderSecrets =
        {
            "your-super-secret-jwt-key-min-32-characters-long!!!",
            "dev-super-secret-jwt-key-min-32-characters-long!!!"
        };

        public ValidateOptionsResult Validate(string? name, JwtOptions options)
        {
            var failures = new List<string>();

            if (string.IsNullOrWhiteSpace(options.Secret))
            {
                failures.Add("Jwt:Secret is not configured. Set Jwt__Secret in the repository's .env file (Development) or as an environment variable.");
            }
            else
            {
                if (Encoding.UTF8.GetByteCount(options.Secret) < JwtOptions.MinimumSecretBytes)
                    failures.Add($"Jwt:Secret must be at least {JwtOptions.MinimumSecretBytes} bytes long.");

                if (PublishedPlaceholderSecrets.Contains(options.Secret))
                    failures.Add("Jwt:Secret is a published placeholder value. Generate a new random secret.");
            }

            if (string.IsNullOrWhiteSpace(options.Issuer))
                failures.Add("Jwt:Issuer is not configured.");

            if (string.IsNullOrWhiteSpace(options.Audience))
                failures.Add("Jwt:Audience is not configured.");

            if (options.ExpiryMinutes is < 1 or > 1440)
                failures.Add("Jwt:ExpiryMinutes must be between 1 and 1440.");

            return failures.Count > 0 ? ValidateOptionsResult.Fail(failures) : ValidateOptionsResult.Success;
        }
    }
}

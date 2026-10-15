using Microsoft.Extensions.Options;

namespace Backend.Options
{
    public class AiOptions
    {
        public const string SectionName = "Ai";
        public const string GeminiProvider = "Gemini";
        public const string OpenAIProvider = "OpenAI";

        public string Provider { get; set; } = GeminiProvider;
        public int TimeoutSeconds { get; set; } = 30;
        public AiProviderOptions Gemini { get; set; } = new() { Model = "gemini-3.5-flash-lite", MaxOutputTokens = 2048 };
        public AiProviderOptions OpenAI { get; set; } = new() { Model = "gpt-4o-mini", MaxOutputTokens = 1000 };

        public bool IsSelected(string provider) => string.Equals(Provider, provider, StringComparison.OrdinalIgnoreCase);
    }

    public class AiProviderOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;

        // Gemini counts "thinking" tokens against this limit too, so leave headroom above the answer length
        public int MaxOutputTokens { get; set; }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
    }

    public class AiOptionsValidator : IValidateOptions<AiOptions>
    {
        // Committed to this repository's history, so never a real key
        private const string PublishedPlaceholderKey = "your-openai-api-key-here";

        private readonly IHostEnvironment _environment;

        public AiOptionsValidator(IHostEnvironment environment)
        {
            _environment = environment;
        }

        public ValidateOptionsResult Validate(string? name, AiOptions options)
        {
            var failures = new List<string>();

            if (options.TimeoutSeconds is < 5 or > 300)
                failures.Add("Ai:TimeoutSeconds must be between 5 and 300.");

            if (options.IsSelected(AiOptions.GeminiProvider))
                ValidateSelected(AiOptions.GeminiProvider, options.Gemini, failures);
            else if (options.IsSelected(AiOptions.OpenAIProvider))
                ValidateSelected(AiOptions.OpenAIProvider, options.OpenAI, failures);
            else
                failures.Add($"Ai:Provider must be '{AiOptions.GeminiProvider}' or '{AiOptions.OpenAIProvider}'.");

            // A placeholder is wrong even for the provider that is not selected
            foreach (var (provider, settings) in new[] { (AiOptions.GeminiProvider, options.Gemini), (AiOptions.OpenAIProvider, options.OpenAI) })
            {
                if (settings.ApiKey == PublishedPlaceholderKey)
                    failures.Add($"Ai:{provider}:ApiKey is a placeholder value. Configure a real key or leave it empty.");
            }

            return failures.Count > 0 ? ValidateOptionsResult.Fail(failures) : ValidateOptionsResult.Success;
        }

        private void ValidateSelected(string provider, AiProviderOptions settings, List<string> failures)
        {
            // Development may run without a key; AI endpoints then answer 503 instead of the app refusing to start
            if (!settings.IsConfigured && !_environment.IsDevelopment())
                failures.Add($"Ai:{provider}:ApiKey is not configured. Set the Ai__{provider}__ApiKey environment variable.");

            if (string.IsNullOrWhiteSpace(settings.Model))
                failures.Add($"Ai:{provider}:Model is not configured.");

            if (settings.MaxOutputTokens is < 1 or > 65536)
                failures.Add($"Ai:{provider}:MaxOutputTokens must be between 1 and 65536.");
        }
    }
}

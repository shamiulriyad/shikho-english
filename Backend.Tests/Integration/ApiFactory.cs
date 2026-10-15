using Backend.Ai;
using Backend.Services;
using Backend.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Backend.Tests.Integration;

/// <summary>
/// Hosts the real API in memory. Runs in a "Testing" environment so the developer's .env file is never loaded,
/// and replaces the AI service with a fake so no live AI API is called.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string JwtSecret = "integration-test-signing-key-at-least-32-bytes";

    private readonly string _environment;
    private readonly bool _fakeAiProvider;
    private readonly Dictionary<string, string?> _settings;

    public ApiFactory(string connectionString, string environment = "Testing", Dictionary<string, string?>? overrides = null, bool fakeAiProvider = true)
    {
        _environment = environment;
        _fakeAiProvider = fakeAiProvider;
        _settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = connectionString,
            ["Jwt:Secret"] = JwtSecret,
            ["Ai:Gemini:ApiKey"] = "test-key-never-sent",
            ["Database:MigrateOnStartup"] = "false"
        };
        foreach (var (key, value) in overrides ?? new())
            _settings[key] = value;
    }

    public FakeGrammarAiService Ai { get; } = new();

    // Used by features that call IAiProvider directly (question analysis)
    public FakeAiProvider AiProvider { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(_environment);
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(_settings));
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IGrammarAiService>();
            services.AddSingleton<IGrammarAiService>(Ai);
            if (_fakeAiProvider)
            {
                services.RemoveAll<IAiProvider>();
                services.AddSingleton<IAiProvider>(AiProvider);
            }
        });
    }
}

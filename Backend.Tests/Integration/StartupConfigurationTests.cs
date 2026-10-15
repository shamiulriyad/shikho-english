using System.Net;
using Backend.Ai;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Integration;

/// <summary>
/// Confirms the validators are wired into startup. The app never connects to a database here.
/// </summary>
public class StartupConfigurationTests
{
    private const string UnusedConnectionString = "Host=localhost;Database=never_connected";

    [Fact]
    public async Task Production_WithValidConfiguration_Starts()
    {
        await using var factory = new ApiFactory(UnusedConnectionString, "Production");

        var response = await factory.CreateClient().GetAsync("/api/practice/history");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Health_ReportsUnhealthyWhenTheDatabaseIsUnreachable()
    {
        await using var factory = new ApiFactory("Host=localhost;Port=1;Database=never_connected;Timeout=2", "Production");

        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("Unhealthy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Production_RemoteDatabaseWithoutSsl_RefusesToStart()
    {
        await using var factory = new ApiFactory("Host=db.example.supabase.co;Database=postgres;Username=postgres;Password=x", "Production");

        var error = Record.Exception(() => factory.CreateClient());

        Assert.Contains("SSL Mode=Require", FindValidationException(error).Message);
    }

    [Fact]
    public async Task AiProvider_DefaultsToGemini()
    {
        await using var factory = new ApiFactory(UnusedConnectionString, "Production", fakeAiProvider: false);

        using var scope = factory.Services.CreateScope();

        Assert.IsType<GeminiProvider>(scope.ServiceProvider.GetRequiredService<IAiProvider>());
    }

    [Fact]
    public async Task AiProvider_CanBeSwitchedToOpenAIByConfiguration()
    {
        await using var factory = new ApiFactory(UnusedConnectionString, "Production", new()
        {
            ["Ai:Provider"] = "OpenAI",
            ["Ai:OpenAI:ApiKey"] = "test-openai-key-never-sent"
        }, fakeAiProvider: false);

        using var scope = factory.Services.CreateScope();

        Assert.IsType<OpenAIProvider>(scope.ServiceProvider.GetRequiredService<IAiProvider>());
    }

    [Theory]
    [InlineData("Jwt:Secret", "", "Jwt:Secret")]
    [InlineData("Jwt:Secret", "your-super-secret-jwt-key-min-32-characters-long!!!", "placeholder")]
    [InlineData("Jwt:Secret", "short", "at least 32 bytes")]
    [InlineData("Ai:Gemini:ApiKey", "", "Ai:Gemini:ApiKey")]
    [InlineData("Ai:Provider", "Claude", "Ai:Provider")]
    [InlineData("Database:MigrateOnStartup", "true", "MigrateOnStartup")]
    [InlineData("ConnectionStrings:DefaultConnection", "", "No database configured")]
    public async Task Production_WithUnsafeConfiguration_RefusesToStart(string key, string value, string expectedMessage)
    {
        await using var factory = new ApiFactory(UnusedConnectionString, "Production", new() { [key] = value });

        var error = Record.Exception(() => factory.CreateClient());

        var validation = FindValidationException(error);
        Assert.Contains(expectedMessage, validation.Message);
    }

    private static OptionsValidationException FindValidationException(Exception? error)
    {
        var pending = new Queue<Exception?>(new[] { error });
        while (pending.Count > 0)
        {
            switch (pending.Dequeue())
            {
                case OptionsValidationException validation:
                    return validation;
                case AggregateException aggregate:
                    foreach (var inner in aggregate.InnerExceptions) pending.Enqueue(inner);
                    break;
                case { InnerException: var inner }:
                    pending.Enqueue(inner);
                    break;
            }
        }
        throw new Xunit.Sdk.XunitException($"Expected startup to fail with OptionsValidationException but got: {error}");
    }
}

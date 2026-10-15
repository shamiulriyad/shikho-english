using Backend.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Hosting.Internal;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Unit;

public class OptionsValidatorTests
{
    private const string ValidSecret = "unit-test-signing-key-that-is-at-least-32-bytes";

    private static IHostEnvironment Environment(string name) => new HostingEnvironment { EnvironmentName = name };

    private static JwtOptions ValidJwt() => new()
    {
        Secret = ValidSecret,
        Issuer = "GrammarLearner",
        Audience = "GrammarLearnerUsers",
        ExpiryMinutes = 60
    };

    [Fact]
    public void Jwt_ValidOptions_Succeed()
    {
        Assert.True(new JwtOptionsValidator().Validate(null, ValidJwt()).Succeeded);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("too-short-secret")]
    [InlineData("your-super-secret-jwt-key-min-32-characters-long!!!")]
    [InlineData("dev-super-secret-jwt-key-min-32-characters-long!!!")]
    public void Jwt_MissingShortOrPlaceholderSecret_Fails(string secret)
    {
        var options = ValidJwt();
        options.Secret = secret;

        var result = new JwtOptionsValidator().Validate(null, options);

        Assert.True(result.Failed);
        Assert.Contains("Jwt:Secret", result.FailureMessage);
    }

    [Fact]
    public void Jwt_SecretLengthIsMeasuredInBytes()
    {
        var options = ValidJwt();
        options.Secret = new string('ব', 11); // 11 Bengali characters = 33 UTF-8 bytes

        Assert.True(new JwtOptionsValidator().Validate(null, options).Succeeded);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1441)]
    public void Jwt_ExpiryOutOfRange_Fails(int minutes)
    {
        var options = ValidJwt();
        options.ExpiryMinutes = minutes;

        Assert.True(new JwtOptionsValidator().Validate(null, options).Failed);
    }

    [Fact]
    public void Jwt_MissingIssuerAndAudience_Fails()
    {
        var options = ValidJwt();
        options.Issuer = "";
        options.Audience = "";

        var result = new JwtOptionsValidator().Validate(null, options);

        Assert.Contains("Jwt:Issuer", result.FailureMessage);
        Assert.Contains("Jwt:Audience", result.FailureMessage);
    }

    private static ValidateOptionsResult ValidateAi(AiOptions options, string environment = "Production") =>
        new AiOptionsValidator(Environment(environment)).Validate(null, options);

    [Fact]
    public void Ai_DefaultsToGeminiWithAModel()
    {
        var options = new AiOptions();

        Assert.True(options.IsSelected(AiOptions.GeminiProvider));
        Assert.False(string.IsNullOrWhiteSpace(options.Gemini.Model));
        Assert.True(options.Gemini.MaxOutputTokens > 0);
    }

    [Fact]
    public void Ai_MissingKey_AllowedInDevelopment()
    {
        Assert.True(ValidateAi(new AiOptions(), Environments.Development).Succeeded);
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public void Ai_MissingGeminiKey_FailsOutsideDevelopment(string environment)
    {
        var result = ValidateAi(new AiOptions(), environment);

        Assert.True(result.Failed);
        Assert.Contains("Ai:Gemini:ApiKey", result.FailureMessage);
    }

    [Fact]
    public void Ai_OnlyTheSelectedProviderNeedsAKey()
    {
        var gemini = new AiOptions();
        gemini.Gemini.ApiKey = "gemini-key";
        Assert.True(ValidateAi(gemini).Succeeded);

        var openAi = new AiOptions { Provider = "openai" };
        openAi.Gemini.ApiKey = "gemini-key";
        var result = ValidateAi(openAi);
        Assert.True(result.Failed);
        Assert.Contains("Ai:OpenAI:ApiKey", result.FailureMessage);

        openAi.OpenAI.ApiKey = "openai-key";
        Assert.True(ValidateAi(openAi).Succeeded);
    }

    [Theory]
    [InlineData("")]
    [InlineData("Claude")]
    public void Ai_UnknownProvider_Fails(string provider)
    {
        var result = ValidateAi(new AiOptions { Provider = provider }, Environments.Development);

        Assert.True(result.Failed);
        Assert.Contains("Ai:Provider", result.FailureMessage);
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("Production")]
    public void Ai_PlaceholderKey_FailsEverywhere_EvenForTheUnselectedProvider(string environment)
    {
        var options = new AiOptions();
        options.Gemini.ApiKey = "gemini-key";
        options.OpenAI.ApiKey = "your-openai-api-key-here";

        Assert.True(ValidateAi(options, environment).Failed);
    }

    [Theory]
    [InlineData(4)]
    [InlineData(301)]
    public void Ai_TimeoutOutOfRange_Fails(int seconds)
    {
        var options = new AiOptions { TimeoutSeconds = seconds };

        Assert.Contains("Ai:TimeoutSeconds", ValidateAi(options, Environments.Development).FailureMessage);
    }

    [Fact]
    public void Ai_SelectedProviderNeedsModelAndTokenLimit()
    {
        var options = new AiOptions();
        options.Gemini.Model = "";
        options.Gemini.MaxOutputTokens = 0;

        var result = ValidateAi(options, Environments.Development);

        Assert.Contains("Ai:Gemini:Model", result.FailureMessage);
        Assert.Contains("Ai:Gemini:MaxOutputTokens", result.FailureMessage);
    }

    [Fact]
    public void Database_MissingConnectionString_Fails()
    {
        var result = new DatabaseOptionsValidator(Environment(Environments.Development)).Validate(null, new DatabaseOptions());

        Assert.True(result.Failed);
        Assert.Contains("ConnectionStrings:DefaultConnection", result.FailureMessage);
    }

    [Fact]
    public void Database_MigrateOnStartup_AllowedInDevelopment()
    {
        var options = new DatabaseOptions { ConnectionString = "Host=localhost", MigrateOnStartup = true };

        Assert.True(new DatabaseOptionsValidator(Environment(Environments.Development)).Validate(null, options).Succeeded);
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public void Database_MigrateOnStartup_FailsOutsideDevelopment(string environment)
    {
        var options = new DatabaseOptions { ConnectionString = "Host=db", MigrateOnStartup = true };

        var result = new DatabaseOptionsValidator(Environment(environment)).Validate(null, options);

        Assert.True(result.Failed);
        Assert.Contains("MigrateOnStartup", result.FailureMessage);
    }

    [Theory]
    [InlineData("Host=db.example.supabase.co;Database=postgres;Username=postgres;Password=x")]
    [InlineData("Host=db.example.supabase.co;Database=postgres;Username=postgres;Password=x;SSL Mode=Prefer")]
    [InlineData("Host=10.0.0.5;Database=app;Username=app;Password=x;SSL Mode=Disable")]
    public void Database_RemoteWithoutSsl_FailsOutsideDevelopment(string connectionString)
    {
        var options = new DatabaseOptions { ConnectionString = connectionString };

        var result = new DatabaseOptionsValidator(Environment(Environments.Production)).Validate(null, options);

        Assert.True(result.Failed);
        Assert.Contains("SSL Mode=Require", result.FailureMessage);
    }

    [Theory]
    [InlineData("Host=db.example.supabase.co;Database=postgres;Username=postgres;Password=x;SSL Mode=Require")]
    [InlineData("Host=db.example.supabase.co;Database=postgres;Username=postgres;Password=x;SSL Mode=VerifyFull")]
    [InlineData("Host=localhost;Database=app;Username=app;Password=x")]
    [InlineData("Host=127.0.0.1;Port=55432;Database=app;Username=app;Password=x")]
    public void Database_EncryptedOrLocal_IsAccepted(string connectionString)
    {
        var options = new DatabaseOptions { ConnectionString = connectionString };

        Assert.True(new DatabaseOptionsValidator(Environment(Environments.Production)).Validate(null, options).Succeeded);
    }

    [Fact]
    public void Database_RemoteWithoutSsl_IsAllowedInDevelopment()
    {
        var options = new DatabaseOptions { ConnectionString = "Host=db.example.com;Database=app;Username=app;Password=x" };

        Assert.True(new DatabaseOptionsValidator(Environment(Environments.Development)).Validate(null, options).Succeeded);
    }

    [Fact]
    public void Database_UnparseableConnectionString_Fails()
    {
        var options = new DatabaseOptions { ConnectionString = "this is not a connection string" };

        var result = new DatabaseOptionsValidator(Environment(Environments.Production)).Validate(null, options);

        Assert.Contains("not a valid PostgreSQL connection string", result.FailureMessage);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(10, 0)]
    public void RateLimiting_LimitsMustBePositive(int ai, int auth)
    {
        var result = new RateLimitingOptionsValidator().Validate(null, new RateLimitingOptions { AiRequestsPerMinute = ai, AuthRequestsPerMinute = auth });

        Assert.True(result.Failed);
    }
}

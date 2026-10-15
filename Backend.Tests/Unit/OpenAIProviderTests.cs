using System.Net;
using System.Text.Json;
using Backend.Ai;
using Backend.Options;
using Backend.Services;
using Backend.Tests.Fakes;

namespace Backend.Tests.Unit;

public class OpenAIProviderTests
{
    private const string ApiKey = "openai-test-key-must-never-leak";

    private readonly ListLogger<OpenAIProvider> _logger = new();

    private OpenAIProvider CreateProvider(StubHttpMessageHandler handler, string apiKey = ApiKey)
    {
        var options = new AiOptions { Provider = AiOptions.OpenAIProvider };
        options.OpenAI.ApiKey = apiKey;
        return new OpenAIProvider(new HttpClient(handler), Microsoft.Extensions.Options.Options.Create(options), _logger);
    }

    private static string Completion(string? content) =>
        JsonSerializer.Serialize(new { choices = new[] { new { message = new { role = "assistant", content } } } });

    private static readonly AiRequest JsonRequest = new("You are a teacher.", "a apple", JsonResponse: true);

    [Fact]
    public async Task SendsChatCompletionWithBearerKey_SystemMessage_AndJsonMode()
    {
        var handler = StubHttpMessageHandler.Json(Completion("{}"));

        var text = await CreateProvider(handler).GenerateAsync(JsonRequest);

        Assert.Equal("{}", text);
        Assert.Equal("https://api.openai.com/v1/chat/completions", handler.LastRequest!.RequestUri!.ToString());
        Assert.Equal("Bearer", handler.LastRequest.Headers.Authorization!.Scheme);
        Assert.Equal(ApiKey, handler.LastRequest.Headers.Authorization.Parameter);

        var body = JsonSerializer.Deserialize<JsonElement>(handler.LastRequestBody!);
        Assert.Equal("gpt-4o-mini", body.GetProperty("model").GetString());
        Assert.Equal(1000, body.GetProperty("max_tokens").GetInt32());
        Assert.Equal("system", body.GetProperty("messages")[0].GetProperty("role").GetString());
        Assert.Equal("You are a teacher.", body.GetProperty("messages")[0].GetProperty("content").GetString());
        Assert.Equal("a apple", body.GetProperty("messages")[1].GetProperty("content").GetString());
        Assert.Equal("json_object", body.GetProperty("response_format").GetProperty("type").GetString());
    }

    [Fact]
    public async Task TextRequests_OmitJsonMode()
    {
        var handler = StubHttpMessageHandler.Json(Completion("Articles are..."));

        await CreateProvider(handler).GenerateAsync(JsonRequest with { JsonResponse = false });

        Assert.False(JsonSerializer.Deserialize<JsonElement>(handler.LastRequestBody!).TryGetProperty("response_format", out _));
    }

    [Fact]
    public async Task ErrorStatus_ThrowsUnavailable()
    {
        var handler = StubHttpMessageHandler.Json("""{ "error": { "message": "Rate limit" } }""", HttpStatusCode.TooManyRequests);

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnavailableMessage, error.Message);
        Assert.DoesNotContain(_logger.Messages, m => m.Contains(ApiKey));
    }

    [Theory]
    [InlineData("""{ "choices": [] }""")]
    [InlineData("""{ "choices": [ { "message": { "content": null } } ] }""")]
    [InlineData("""{ "id": "x" }""")]
    public async Task UnexpectedShape_ThrowsUnexpectedResponse(string body)
    {
        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(StubHttpMessageHandler.Json(body)).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnexpectedResponseMessage, error.Message);
    }

    [Fact]
    public async Task MissingKey_ThrowsUnavailable_WithoutCallingOpenAI()
    {
        var handler = StubHttpMessageHandler.Json(Completion("{}"));

        await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler, apiKey: "").GenerateAsync(JsonRequest));

        Assert.Equal(0, handler.Calls);
    }
}

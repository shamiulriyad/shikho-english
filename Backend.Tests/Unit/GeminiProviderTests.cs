using System.Net;
using System.Text.Json;
using Backend.Ai;
using Backend.Options;
using Backend.Services;
using Backend.Tests.Fakes;

namespace Backend.Tests.Unit;

public class GeminiProviderTests
{
    private const string ApiKey = "gemini-test-key-must-never-leak";

    private readonly ListLogger<GeminiProvider> _logger = new();

    private GeminiProvider CreateProvider(StubHttpMessageHandler handler, string apiKey = ApiKey)
    {
        var options = new AiOptions();
        options.Gemini.ApiKey = apiKey;
        options.Gemini.Model = "gemini-3.5-flash-lite";
        options.Gemini.MaxOutputTokens = 2048;
        return new GeminiProvider(new HttpClient(handler), Microsoft.Extensions.Options.Options.Create(options), _logger);
    }

    private static string Candidate(string text, string finishReason = "STOP") => JsonSerializer.Serialize(new
    {
        candidates = new[] { new { content = new { role = "model", parts = new[] { new { text } } }, finishReason } }
    });

    private static readonly AiRequest JsonRequest = new("You are a teacher.", "Student sentence: a apple", JsonResponse: true);

    [Fact]
    public async Task SendsGenerateContentWithKeyInHeaderNotUrl()
    {
        var handler = StubHttpMessageHandler.Json(Candidate("{}"));

        await CreateProvider(handler).GenerateAsync(JsonRequest);

        var request = handler.LastRequest!;
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", request.RequestUri!.ToString());
        Assert.Equal(ApiKey, request.Headers.GetValues("x-goog-api-key").Single());
        Assert.DoesNotContain(ApiKey, request.RequestUri.ToString());
        Assert.DoesNotContain(ApiKey, handler.LastRequestBody);
    }

    [Fact]
    public async Task SendsSystemInstructionSeparatelyFromStudentText_AndRequestsJson()
    {
        var handler = StubHttpMessageHandler.Json(Candidate("{}"));

        await CreateProvider(handler).GenerateAsync(JsonRequest with { Temperature = 0.3 });

        var body = JsonSerializer.Deserialize<JsonElement>(handler.LastRequestBody!);
        Assert.Equal("You are a teacher.", body.GetProperty("systemInstruction").GetProperty("parts")[0].GetProperty("text").GetString());
        var content = body.GetProperty("contents")[0];
        Assert.Equal("user", content.GetProperty("role").GetString());
        Assert.Equal("Student sentence: a apple", content.GetProperty("parts")[0].GetProperty("text").GetString());
        var config = body.GetProperty("generationConfig");
        Assert.Equal(0.3, config.GetProperty("temperature").GetDouble());
        Assert.Equal(2048, config.GetProperty("maxOutputTokens").GetInt32());
        Assert.Equal("application/json", config.GetProperty("responseMimeType").GetString());
    }

    [Fact]
    public async Task TextRequests_DoNotForceJson()
    {
        var handler = StubHttpMessageHandler.Json(Candidate("Articles are..."));

        await CreateProvider(handler).GenerateAsync(JsonRequest with { JsonResponse = false });

        var config = JsonSerializer.Deserialize<JsonElement>(handler.LastRequestBody!).GetProperty("generationConfig");
        Assert.False(config.TryGetProperty("responseMimeType", out _));
    }

    [Fact]
    public async Task ReturnsAnswerText_SkippingThoughtParts()
    {
        var body = JsonSerializer.Serialize(new
        {
            candidates = new[]
            {
                new
                {
                    content = new
                    {
                        role = "model",
                        parts = new object[]
                        {
                            new { text = "Let me think about vowels...", thought = true },
                            new { text = "{\"correctedSentence\":" },
                            new { text = "\"an apple\"}" }
                        }
                    },
                    finishReason = "STOP"
                }
            }
        });

        var text = await CreateProvider(StubHttpMessageHandler.Json(body)).GenerateAsync(JsonRequest);

        Assert.Equal("{\"correctedSentence\":\"an apple\"}", text);
    }

    [Fact]
    public async Task BlockedPrompt_ThrowsWithRephraseMessage()
    {
        var body = """{ "promptFeedback": { "blockReason": "SAFETY" } }""";

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(StubHttpMessageHandler.Json(body)).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.BlockedMessage, error.Message);
    }

    [Theory]
    [InlineData("SAFETY", AIServiceException.BlockedMessage)]
    [InlineData("MAX_TOKENS", AIServiceException.UnexpectedResponseMessage)]
    [InlineData("RECITATION", AIServiceException.UnexpectedResponseMessage)]
    public async Task UnfinishedCandidate_Throws(string finishReason, string expectedMessage)
    {
        var handler = StubHttpMessageHandler.Json(Candidate("{\"partial\":", finishReason));

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler).GenerateAsync(JsonRequest));

        Assert.Equal(expectedMessage, error.Message);
    }

    [Theory]
    [InlineData("""{ "candidates": [] }""")]
    [InlineData("""{ "candidates": [ { "finishReason": "STOP", "content": { "parts": [] } } ] }""")]
    [InlineData("""{ "usageMetadata": {} }""")]
    public async Task MissingAnswer_ThrowsUnexpectedResponse(string body)
    {
        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(StubHttpMessageHandler.Json(body)).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnexpectedResponseMessage, error.Message);
    }

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.Unauthorized)]
    public async Task ErrorStatus_ThrowsUnavailable_AndNeverLogsTheKey(HttpStatusCode status)
    {
        var handler = StubHttpMessageHandler.Json("""{ "error": { "code": 429, "message": "Resource exhausted" } }""", status);

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnavailableMessage, error.Message);
        Assert.Contains(_logger.Messages, m => m.Contains(((int)status).ToString()));
        Assert.DoesNotContain(_logger.Messages, m => m.Contains(ApiKey));
    }

    [Fact]
    public async Task NonJsonBody_ThrowsUnexpectedResponse()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("<html>proxy</html>") });

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnexpectedResponseMessage, error.Message);
    }

    [Fact]
    public async Task NetworkFailure_ThrowsUnavailable()
    {
        var handler = StubHttpMessageHandler.Throws(new HttpRequestException("No such host is known."));

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnavailableMessage, error.Message);
    }

    [Fact]
    public async Task Timeout_ThrowsUnavailable()
    {
        var handler = StubHttpMessageHandler.Throws(new TaskCanceledException("The request was canceled due to the configured HttpClient.Timeout"));

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler).GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnavailableMessage, error.Message);
        Assert.Contains(_logger.Messages, m => m.Contains("timed out"));
    }

    [Fact]
    public async Task CallerCancellation_IsNotReportedAsAnAiFailure()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var handler = StubHttpMessageHandler.Throws(new TaskCanceledException());

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => CreateProvider(handler).GenerateAsync(JsonRequest, cancellation.Token));
    }

    [Fact]
    public async Task MissingKey_ThrowsUnavailable_WithoutCallingGemini()
    {
        var handler = StubHttpMessageHandler.Json(Candidate("{}"));

        var error = await Assert.ThrowsAsync<AIServiceException>(() => CreateProvider(handler, apiKey: "").GenerateAsync(JsonRequest));

        Assert.Equal(AIServiceException.UnavailableMessage, error.Message);
        Assert.Equal(0, handler.Calls);
    }
}

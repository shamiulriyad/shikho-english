using Backend.Ai;
using Backend.Services;
using Backend.Tests.Fakes;

namespace Backend.Tests.Unit;

public class GrammarAiServiceTests
{
    private class FakeProvider : IAiProvider
    {
        public string Name => "Fake";
        public string Model => "fake-model";
        public string Response { get; set; } = "{}";
        public List<AiRequest> Requests { get; } = new();

        public Task<string> GenerateAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            Requests.Add(request);
            return Task.FromResult(Response);
        }
    }

    private readonly FakeProvider _provider = new();
    private readonly ListLogger<GrammarAiService> _logger = new();
    private readonly GrammarAiService _service;

    public GrammarAiServiceTests()
    {
        _service = new GrammarAiService(_provider, _logger);
    }

    [Fact]
    public async Task CorrectSentence_PutsStudentTextInThePrompt_AndParsesTheAnswer()
    {
        _provider.Response = """
            {
              "correctedSentence": "She is an honest girl.",
              "isCorrect": false,
              "mistakes": [ { "type": "article error", "original": "a honest", "correction": "an honest", "reason": "Vowel sound." } ],
              "explanation": "Use 'an' before a vowel sound."
            }
            """;

        var (corrected, mistakes, explanation) = await _service.CorrectSentence("She is a honest girl.");

        Assert.Equal("She is an honest girl.", corrected);
        Assert.Equal("an honest", Assert.Single(mistakes).Correction);
        Assert.Equal("Use 'an' before a vowel sound.", explanation);

        var request = Assert.Single(_provider.Requests);
        Assert.True(request.JsonResponse);
        Assert.Contains("She is a honest girl.", request.Prompt);
        Assert.DoesNotContain("She is a honest girl.", request.SystemInstruction);
    }

    [Fact]
    public async Task CorrectSentence_WithoutMistakesField_ReturnsNoMistakes()
    {
        _provider.Response = """{ "correctedSentence": "Fine.", "explanation": "Correct." }""";

        var (_, mistakes, _) = await _service.CorrectSentence("Fine.");

        Assert.Empty(mistakes);
    }

    [Theory]
    [InlineData("not json at all")]
    [InlineData("""{ "explanation": "missing corrected sentence" }""")]
    [InlineData("""{ "correctedSentence": "x", "explanation": "y", "mistakes": [ { "type": "t" } ] }""")]
    public async Task CorrectSentence_UnexpectedJson_ThrowsAndLogsTruncatedResponse(string response)
    {
        _provider.Response = response;

        var error = await Assert.ThrowsAsync<AIServiceException>(() => _service.CorrectSentence("x"));

        Assert.Equal(AIServiceException.UnexpectedResponseMessage, error.Message);
        Assert.Contains(_logger.Messages, m => m.Contains("Fake"));
    }

    [Fact]
    public async Task CorrectSentence_HugeInvalidResponse_IsTruncatedInLogs()
    {
        _provider.Response = new string('x', 5000);

        await Assert.ThrowsAsync<AIServiceException>(() => _service.CorrectSentence("x"));

        Assert.All(_logger.Messages, m => Assert.True(m.Length < 1000));
    }

    [Fact]
    public async Task GenerateQuizQuestion_RequestsJson_AndReturnsProviderText()
    {
        _provider.Response = """{ "question": "Q" }""";

        var json = await _service.GenerateQuizQuestion();

        Assert.Equal("""{ "question": "Q" }""", json);
        Assert.True(_provider.Requests.Single().JsonResponse);
    }

    [Fact]
    public async Task GetGrammarExplanation_RequestsPlainText()
    {
        _provider.Response = "Articles are...";

        var text = await _service.GetGrammarExplanation("definite article");

        Assert.Equal("Articles are...", text);
        var request = _provider.Requests.Single();
        Assert.False(request.JsonResponse);
        Assert.Contains("definite article", request.Prompt);
    }
}

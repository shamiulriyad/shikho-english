using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Fakes;

namespace Backend.Tests.Unit;

public class GrammarPracticeServiceTests
{
    private readonly InMemoryGrammarPracticeRepository _practiceRepository = new();
    private readonly InMemoryQuizRepository _quizRepository = new();
    private readonly FakeGrammarAiService _ai = new();
    private readonly GrammarPracticeService _service;

    public GrammarPracticeServiceTests()
    {
        _service = new GrammarPracticeService(_practiceRepository, _quizRepository, _ai);
    }

    [Fact]
    public async Task CorrectSentence_WithMistakes_SavesPracticeAsIncorrect()
    {
        _ai.CorrectSentenceHandler = _ => ("She is an honest girl.", new List<MistakeDto>
        {
            new() { Type = "article error", Original = "a honest", Correction = "an honest", Reason = "Vowel sound." }
        }, "Use 'an' before a vowel sound.");

        var result = await _service.CorrectSentence(7, new PracticeRequestDto { Sentence = "She is a honest girl." });

        Assert.True(result.Id > 0);
        Assert.False(result.IsCorrect);
        Assert.Equal("She is a honest girl.", result.OriginalSentence);
        Assert.Equal("She is an honest girl.", result.CorrectedSentence);
        Assert.Single(result.Mistakes);

        var history = (await _service.GetUserPractices(7)).ToList();
        Assert.Single(history);
        Assert.Equal("an honest", history[0].Mistakes[0].Correction);
    }

    [Fact]
    public async Task CorrectSentence_WithoutMistakes_IsCorrect()
    {
        var result = await _service.CorrectSentence(7, new PracticeRequestDto { Sentence = "She is an honest girl." });

        Assert.True(result.IsCorrect);
        Assert.Empty(result.Mistakes);
    }

    [Fact]
    public async Task CorrectSentence_WhenAiFails_SavesNothing()
    {
        _ai.CorrectSentenceHandler = _ => throw new AIServiceException("down");

        await Assert.ThrowsAsync<AIServiceException>(() =>
            _service.CorrectSentence(7, new PracticeRequestDto { Sentence = "x" }));
        Assert.Equal(0, await _practiceRepository.GetCountByUserId(7));
    }

    [Fact]
    public async Task CorrectSentence_WhenSaveFails_PropagatesTheError()
    {
        _practiceRepository.SaveException = new InvalidOperationException("database unavailable");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CorrectSentence(7, new PracticeRequestDto { Sentence = "x" }));
    }

    [Fact]
    public async Task GetUserPractices_OnlyReturnsOwnHistory()
    {
        await _service.CorrectSentence(1, new PracticeRequestDto { Sentence = "mine" });
        await _service.CorrectSentence(2, new PracticeRequestDto { Sentence = "theirs" });

        var history = (await _service.GetUserPractices(1)).ToList();

        Assert.Single(history);
        Assert.Equal("mine", history[0].OriginalSentence);
    }

    [Fact]
    public async Task GetUserProgress_ComputesPercentageAndQuizAverage()
    {
        await _service.CorrectSentence(1, new PracticeRequestDto { Sentence = "ok" });
        _ai.CorrectSentenceHandler = s => (s, new List<MistakeDto> { new() { Type = "article error" } }, "fix");
        await _service.CorrectSentence(1, new PracticeRequestDto { Sentence = "bad" });

        var progress = await _service.GetUserProgress(1);

        Assert.Equal(2, progress.TotalPractices);
        Assert.Equal(1, progress.CorrectPractices);
        Assert.Equal(50, progress.CorrectPercentage);
        Assert.Equal(0, progress.TotalQuizzes);
        Assert.Equal(0, progress.AverageQuizScore);
    }

    [Fact]
    public async Task GetUserProgress_WithNoPractice_ReturnsZeroes()
    {
        var progress = await _service.GetUserProgress(99);

        Assert.Equal(0, progress.TotalPractices);
        Assert.Equal(0, progress.CorrectPercentage);
    }
}

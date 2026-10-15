using Backend.DTOs;
using Backend.Services;

namespace Backend.Tests.Fakes;

/// <summary>
/// Stand-in for the AI service so tests never call a live AI API.
/// </summary>
public class FakeGrammarAiService : IGrammarAiService
{
    public Func<string, (string, List<MistakeDto>, string)> CorrectSentenceHandler { get; set; } =
        sentence => (sentence, new List<MistakeDto>(), "No mistakes.");

    public Func<int, string> QuizQuestionHandler { get; set; } = _ => """
        {
          "question": "Choose the correct article",
          "incorrectSentence": "She is ___ honest girl.",
          "correctAnswer": "An",
          "explanation": "Use 'an' before a vowel sound."
        }
        """;

    public int QuizQuestionCalls { get; private set; }

    public Task<(string correctedSentence, List<MistakeDto> mistakes, string explanation)> CorrectSentence(string sentence)
        => Task.FromResult(CorrectSentenceHandler(sentence));

    public Task<string> GenerateQuizQuestion()
        => Task.FromResult(QuizQuestionHandler(QuizQuestionCalls++));

    public Task<string> GetGrammarExplanation(string topic)
        => Task.FromResult($"Explanation of {topic}");
}

using System.Text.Json;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Fakes;

namespace Backend.Tests.Unit;

public class QuizServiceTests
{
    private readonly InMemoryQuizRepository _repository = new();
    private readonly FakeGrammarAiService _ai = new();
    private readonly FakeAnswerEvaluator _evaluator = new();
    private readonly QuizService _service;

    private class FakeAnswerEvaluator : IAnswerEvaluator
    {
        public Func<QuizQuestion, string, AnswerEvaluation> Handler { get; set; } = (_, _) => new AnswerEvaluation(true, null, null);
        public int Calls { get; private set; }

        public Task<AnswerEvaluation> Evaluate(QuizQuestion question, string answer)
        {
            Calls++;
            return Task.FromResult(Handler(question, answer));
        }
    }

    private async Task<Quiz> SavePracticeSet()
    {
        var quiz = new Quiz { UserId = 1, Title = "Practice: Articles", TotalQuestions = 2 };
        foreach (var sentence in new[] { "___ sun rises.", "He is ___ honest man." })
        {
            quiz.Questions.Add(new QuizQuestion
            {
                Question = "Fill in the blank",
                IncorrectSentence = sentence,
                CorrectAnswer = "the",
                AcceptedAnswersJson = JsonSerializer.Serialize(new[] { "the" }),
                Explanation = "Because.",
                ExplanationBn = "কারণ।"
            });
        }
        await _repository.Add(quiz);
        await _repository.SaveChanges();
        return quiz;
    }

    public QuizServiceTests()
    {
        _service = new QuizService(_repository, _ai, _evaluator);
    }

    [Fact]
    public async Task CreateQuiz_GeneratesRequestedNumberOfQuestions_AndHidesAnswers()
    {
        var quiz = await _service.CreateQuiz(userId: 1, numberOfQuestions: 3);

        Assert.Equal(3, quiz.TotalQuestions);
        Assert.Equal(3, quiz.Questions.Count);
        Assert.Equal(3, _ai.QuizQuestionCalls);
        Assert.All(quiz.Questions, q =>
        {
            Assert.Null(q.CorrectAnswer);
            Assert.Null(q.Explanation);
            Assert.Null(q.UserAnswer);
            Assert.Null(q.IsAnsweredCorrectly);
        });
    }

    [Fact]
    public async Task CreateQuiz_WhenAiReturnsMalformedJson_ThrowsAiServiceException_AndSavesNothing()
    {
        _ai.QuizQuestionHandler = _ => "not json";

        await Assert.ThrowsAsync<AIServiceException>(() => _service.CreateQuiz(1, 2));
        Assert.Empty(await _repository.GetAll());
    }

    [Fact]
    public async Task CreateQuiz_WhenAiOmitsRequiredField_ThrowsAiServiceException()
    {
        _ai.QuizQuestionHandler = _ => """{ "question": "Choose", "incorrectSentence": "___ apple" }""";

        await Assert.ThrowsAsync<AIServiceException>(() => _service.CreateQuiz(1, 1));
    }

    [Fact]
    public async Task SubmitAnswer_Correct_IsCaseInsensitive_IncrementsScore_AndRevealsAnswer()
    {
        var quiz = await _service.CreateQuiz(1, 2);
        var questionId = quiz.Questions[0].Id;

        var result = await _service.SubmitQuizAnswer(1, quiz.Id, questionId, "  AN ");

        Assert.NotNull(result);
        Assert.Equal(1, result.Score);
        var answered = result.Questions.Single(q => q.Id == questionId);
        Assert.True(answered.IsAnsweredCorrectly);
        Assert.Equal("an", answered.CorrectAnswer);
        Assert.Equal("AN", answered.UserAnswer);
        Assert.NotNull(answered.Explanation);
        Assert.False(result.IsCompleted);
    }

    [Fact]
    public async Task SubmitAnswer_Twice_DoesNotInflateScore()
    {
        var quiz = await _service.CreateQuiz(1, 2);
        var questionId = quiz.Questions[0].Id;

        await _service.SubmitQuizAnswer(1, quiz.Id, questionId, "an");
        var second = await _service.SubmitQuizAnswer(1, quiz.Id, questionId, "an");

        Assert.Equal(1, second!.Score);
    }

    [Fact]
    public async Task SubmitAnswer_Wrong_DoesNotIncrementScore()
    {
        var quiz = await _service.CreateQuiz(1, 1);

        var result = await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions[0].Id, "the");

        Assert.Equal(0, result!.Score);
        Assert.False(result.Questions[0].IsAnsweredCorrectly);
    }

    [Fact]
    public async Task SubmitAnswer_AllQuestionsAnswered_CompletesQuiz()
    {
        var quiz = await _service.CreateQuiz(1, 2);

        await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions[0].Id, "an");
        var result = await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions[1].Id, "a");

        Assert.True(result!.IsCompleted);
        Assert.NotNull(result.CompletedAt);
        Assert.Equal(1, result.Score);
    }

    [Fact]
    public async Task SubmitAnswer_ForAnotherUsersQuiz_ReturnsNull()
    {
        var quiz = await _service.CreateQuiz(userId: 1, numberOfQuestions: 1);

        var result = await _service.SubmitQuizAnswer(userId: 2, quiz.Id, quiz.Questions[0].Id, "an");

        Assert.Null(result);
    }

    [Fact]
    public async Task SubmitAnswer_UnknownQuestion_ReturnsNull()
    {
        var quiz = await _service.CreateQuiz(1, 1);

        Assert.Null(await _service.SubmitQuizAnswer(1, quiz.Id, questionId: 999, "an"));
    }

    [Fact]
    public async Task GetQuiz_ForAnotherUser_ReturnsNull()
    {
        var quiz = await _service.CreateQuiz(userId: 1, numberOfQuestions: 1);

        Assert.Null(await _service.GetQuiz(userId: 2, quiz.Id));
        Assert.NotNull(await _service.GetQuiz(userId: 1, quiz.Id));
    }

    [Fact]
    public async Task CreateQuiz_WhenSaveFails_PropagatesTheError()
    {
        _repository.SaveException = new InvalidOperationException("database unavailable");

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateQuiz(1, 1));
    }

    [Fact]
    public async Task ArticleQuestions_NeverUseTheEvaluator()
    {
        var quiz = await _service.CreateQuiz(1, 1);

        var result = await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions[0].Id, "an");

        Assert.Equal(0, _evaluator.Calls);
        Assert.Equal(QuizAnswerTypes.Articles, result!.Questions[0].AnswerType);
    }

    [Fact]
    public async Task TextQuestions_UseTheEvaluator_AndRevealBilingualFeedbackAfterAnswering()
    {
        _evaluator.Handler = (_, _) => new AnswerEvaluation(false, "Listen to the sound.", "ধ্বনি খেয়াল করো।");
        var quiz = await SavePracticeSet();

        var before = await _service.GetQuiz(1, quiz.Id);
        Assert.All(before!.Questions, q =>
        {
            Assert.Equal(QuizAnswerTypes.Text, q.AnswerType);
            Assert.Null(q.ExplanationBn);
            Assert.Null(q.CorrectAnswer);
        });

        var result = await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions.First().Id, " a ");

        var answered = result!.Questions[0];
        Assert.False(answered.IsAnsweredCorrectly);
        Assert.Equal("a", answered.UserAnswer);
        Assert.Equal("Listen to the sound.", answered.FeedbackEn);
        Assert.Equal("ধ্বনি খেয়াল করো।", answered.FeedbackBn);
        Assert.Equal("কারণ।", answered.ExplanationBn);
        Assert.Null(result.Questions[1].FeedbackEn);
        Assert.Equal(0, result.Score);
    }

    [Fact]
    public async Task TextQuestions_CorrectAnswersScore_AndCompleteTheSet()
    {
        var quiz = await SavePracticeSet();

        await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions.First().Id, "the");
        var result = await _service.SubmitQuizAnswer(1, quiz.Id, quiz.Questions.Last().Id, "the");

        Assert.Equal(2, result!.Score);
        Assert.True(result.IsCompleted);
    }

    [Fact]
    public async Task TextQuestions_WhenTheAiIsUnavailable_NothingIsRecorded()
    {
        _evaluator.Handler = (_, _) => throw new AIServiceException(AIServiceException.UnavailableMessage);
        var quiz = await SavePracticeSet();
        var questionId = quiz.Questions.First().Id;

        await Assert.ThrowsAsync<AIServiceException>(() => _service.SubmitQuizAnswer(1, quiz.Id, questionId, "a"));

        var after = await _service.GetQuiz(1, quiz.Id);
        Assert.Null(after!.Questions.Single(q => q.Id == questionId).UserAnswer);
        Assert.Equal(1, _repository.SaveCalls); // only the initial save of the set
    }
}

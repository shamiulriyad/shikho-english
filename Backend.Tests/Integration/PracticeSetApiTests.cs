using System.Net;
using System.Net.Http.Json;
using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Fakes;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Integration;

public class PracticeSetApiTests : ApiTestBase
{
    public PracticeSetApiTests(PostgresFixture postgres) : base(postgres) { }

    private async Task<(HttpClient Client, QuestionAnalysisDto Analysis)> AnalyzedQuestionAsync(string email = "student@example.com", string username = "student")
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid());
        var (client, _) = await RegisterAsync(email, username);
        var analysis = await (await client.PostAsJsonAsync("/api/questions/analyze", new { questionText = "She is ___ honest girl." }))
            .Content.ReadFromJsonAsync<QuestionAnalysisDto>();
        Factory.AiProvider.Requests.Clear();
        return (client, analysis!);
    }

    private async Task<QuizDto> CreateSetAsync(HttpClient client, int analysisId, int count)
    {
        Factory.AiProvider.Reply(PracticeReplies.Set(count));
        var response = await client.PostAsJsonAsync($"/api/questions/{analysisId}/practice-set", new { count });
        response.EnsureSuccessStatusCode();
        Factory.AiProvider.Requests.Clear();
        return (await response.Content.ReadFromJsonAsync<QuizDto>())!;
    }

    private static Task<HttpResponseMessage> Answer(HttpClient client, QuizDto set, int index, string answer) =>
        client.PostAsJsonAsync($"/api/quiz/{set.Id}/answer", new { questionId = set.Questions[index].Id, answer });

    [Fact]
    public async Task CreatesAPracticeSetLinkedToTheAnalysis_WithAnswersHidden()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        Factory.AiProvider.Reply(PracticeReplies.Set(3));

        var response = await client.PostAsJsonAsync($"/api/questions/{analysis.Id}/practice-set", new { count = 3 });

        response.EnsureSuccessStatusCode();
        var set = (await response.Content.ReadFromJsonAsync<QuizDto>())!;
        Assert.Equal("Practice: Articles", set.Title);
        Assert.Equal(3, set.TotalQuestions);
        Assert.Equal("articles", set.Topic!.Code);
        Assert.Equal(analysis.Id, set.SourceAnalysisId);
        Assert.All(set.Questions, q =>
        {
            Assert.Equal(QuizAnswerTypes.Text, q.AnswerType);
            Assert.Null(q.CorrectAnswer);
            Assert.Null(q.Explanation);
            Assert.Null(q.ExplanationBn);
        });
        Assert.Equal("He is ___ honour to his family.", set.Questions[0].IncorrectSentence);
        Assert.Contains("She is ___ honest girl.", Assert.Single(Factory.AiProvider.Requests).Prompt);

        // Practice sets appear with the student's other quizzes and in progress
        var quizzes = await client.GetFromJsonAsync<List<QuizDto>>("/api/quiz/user/all");
        Assert.Equal(set.Id, Assert.Single(quizzes!).Id);
    }

    [Fact]
    public async Task ExactAnswer_IsCorrect_WithoutAnAiCall()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        var set = await CreateSetAsync(client, analysis.Id, 3);

        var result = await (await Answer(client, set, 2, "  THE. ")).Content.ReadFromJsonAsync<QuizDto>();

        var answered = result!.Questions[2];
        Assert.True(answered.IsAnsweredCorrectly);
        Assert.Equal("The", answered.CorrectAnswer);
        Assert.Equal("বানান নয়, উচ্চারণ দেখে বেছে নাও।", answered.ExplanationBn);
        Assert.Null(answered.FeedbackEn);
        Assert.Equal(1, result.Score);
        Assert.Empty(Factory.AiProvider.Requests);
    }

    [Fact]
    public async Task OtherAnswers_AreMarkedByTheAi_WithBilingualFeedback()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        var set = await CreateSetAsync(client, analysis.Id, 1);
        Factory.AiProvider.Reply(PracticeReplies.Evaluation(false));

        var result = await (await Answer(client, set, 0, "a")).Content.ReadFromJsonAsync<QuizDto>();

        var answered = result!.Questions[0];
        Assert.False(answered.IsAnsweredCorrectly);
        Assert.Equal("Not quite: listen to the first sound.", answered.FeedbackEn);
        Assert.Equal("পুরোপুরি ঠিক নয়: প্রথম ধ্বনিটি খেয়াল করো।", answered.FeedbackBn);
        Assert.True(result.IsCompleted);

        await using var db = CreateDbContext();
        var saved = await db.QuizQuestions.SingleAsync(q => q.Id == answered.Id);
        Assert.Equal("Not quite: listen to the first sound.", saved.FeedbackEn);
    }

    [Fact]
    public async Task AiUnavailableWhileMarking_Returns503_AndTheStudentCanAnswerAgain()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        var set = await CreateSetAsync(client, analysis.Id, 1);
        Factory.AiProvider.Throw(new AIServiceException(AIServiceException.UnavailableMessage));

        var failed = await Answer(client, set, 0, "a");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, failed.StatusCode);
        Assert.Equal(AIServiceException.UnavailableMessage, (await ReadProblemAsync(failed)).GetProperty("message").GetString());

        var retry = await (await Answer(client, set, 0, "an")).Content.ReadFromJsonAsync<QuizDto>();
        Assert.True(retry!.Questions[0].IsAnsweredCorrectly);
    }

    [Fact]
    public async Task InvalidAiRepliesForTheSet_Return503_AndSaveNoQuiz()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        Factory.AiProvider.Reply(PracticeReplies.Set(2), PracticeReplies.Set(3, explanationBn: "English only."));

        var response = await client.PostAsJsonAsync($"/api/questions/{analysis.Id}/practice-set", new { count = 3 });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(2, Factory.AiProvider.Requests.Count);
        Assert.Contains("must have exactly 3 item(s), not 2", Factory.AiProvider.Requests[1].Prompt);
        await using var db = CreateDbContext();
        Assert.Equal(0, await db.Quizzes.CountAsync());
    }

    [Fact]
    public async Task AnotherStudentsAnalysis_Returns404_WithoutCallingTheAi()
    {
        var (_, analysis) = await AnalyzedQuestionAsync("owner@example.com", "owner");
        var (other, _) = await RegisterAsync("other@example.com", "other");

        var response = await other.PostAsJsonAsync($"/api/questions/{analysis.Id}/practice-set", new { count = 3 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(Factory.AiProvider.Requests);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public async Task CountOutOfRange_Returns400(int count)
    {
        var (client, analysis) = await AnalyzedQuestionAsync();

        var response = await client.PostAsJsonAsync($"/api/questions/{analysis.Id}/practice-set", new { count });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(Factory.AiProvider.Requests);
    }

    [Fact]
    public async Task OverlongAnswer_Returns400()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        var set = await CreateSetAsync(client, analysis.Id, 1);

        var response = await Answer(client, set, 0, new string('x', 501));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ConcurrentWritesToTheSameQuestion_AreRejectedByTheDatabase()
    {
        var (client, analysis) = await AnalyzedQuestionAsync();
        var set = await CreateSetAsync(client, analysis.Id, 1);
        var questionId = set.Questions[0].Id;

        await using var first = CreateDbContext();
        await using var second = CreateDbContext();
        var firstCopy = await first.QuizQuestions.SingleAsync(q => q.Id == questionId);
        var secondCopy = await second.QuizQuestions.SingleAsync(q => q.Id == questionId);

        firstCopy.UserAnswer = "an";
        await first.SaveChangesAsync();
        secondCopy.UserAnswer = "a";

        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
    }
}

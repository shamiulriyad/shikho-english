using System.Net;
using System.Net.Http.Json;
using Backend.DTOs;
using Backend.Tests.Fakes;

namespace Backend.Tests.Integration;

public class TopicProgressApiTests : ApiTestBase
{
    public TopicProgressApiTests(PostgresFixture postgres) : base(postgres) { }

    private static object Question(string topicCode, string? studentAnswer = null) =>
        new { questionText = $"A {topicCode} question", topicCode, studentAnswer };

    [Fact]
    public async Task CombinesAnalysesAndPracticePerTopic_AndFlagsWeakTopics()
    {
        var (client, _) = await RegisterAsync();

        // Articles: one analysis with a wrong student answer, then a practice set with 1 of 3 right
        Factory.AiProvider.Reply(AnalysisReplies.Valid("articles", studentAnswerIsCorrect: false));
        var analysis = await (await client.PostAsJsonAsync("/api/questions/analyze", Question("articles", "a")))
            .Content.ReadFromJsonAsync<QuestionAnalysisDto>();
        Factory.AiProvider.Reply(PracticeReplies.Set(3));
        var set = await (await client.PostAsJsonAsync($"/api/questions/{analysis!.Id}/practice-set", new { count = 3 }))
            .Content.ReadFromJsonAsync<QuizDto>();
        Factory.AiProvider.Reply(PracticeReplies.Evaluation(false));
        await client.PostAsJsonAsync($"/api/quiz/{set!.Id}/answer", new { questionId = set.Questions[0].Id, answer = "a" });
        await client.PostAsJsonAsync($"/api/quiz/{set.Id}/answer", new { questionId = set.Questions[1].Id, answer = "an" });
        await client.PostAsJsonAsync($"/api/quiz/{set.Id}/answer", new { questionId = set.Questions[2].Id, answer = "the" });

        // Narration: one analysis without a student answer
        Factory.AiProvider.Reply(AnalysisReplies.Valid("narration"));
        await client.PostAsJsonAsync("/api/questions/analyze", Question("narration"));

        var progress = (await client.GetFromJsonAsync<List<TopicProgressDto>>("/api/progress/topics"))!;

        Assert.Equal(11, progress.Count);
        Assert.Equal("articles", progress[0].Topic.Code);

        var articles = progress.Single(p => p.Topic.Code == "articles");
        Assert.Equal(1, articles.QuestionsAnalysed);
        Assert.Equal(3, articles.PracticeAnswered);
        Assert.Equal(4, articles.AnswersMarked);
        Assert.Equal(1, articles.AnswersCorrect);
        Assert.Equal(25, articles.AccuracyPercentage);
        Assert.True(articles.NeedsPractice);
        Assert.NotNull(articles.LastActivityAt);

        var narration = progress.Single(p => p.Topic.Code == "narration");
        Assert.Equal(1, narration.QuestionsAnalysed);
        Assert.Equal(0, narration.AnswersMarked);
        Assert.Null(narration.AccuracyPercentage);
        Assert.False(narration.NeedsPractice);

        var untouched = progress.Single(p => p.Topic.Code == "punctuation");
        Assert.Equal(0, untouched.QuestionsAnalysed);
        Assert.Null(untouched.LastActivityAt);
    }

    [Fact]
    public async Task OnlyCountsTheStudentsOwnWork()
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid("articles"));
        var (owner, _) = await RegisterAsync("owner@example.com", "owner");
        await owner.PostAsJsonAsync("/api/questions/analyze", Question("articles"));
        var (other, _) = await RegisterAsync("other@example.com", "other");

        var progress = await other.GetFromJsonAsync<List<TopicProgressDto>>("/api/progress/topics");

        Assert.All(progress!, p => Assert.Equal(0, p.QuestionsAnalysed));
    }

    [Fact]
    public async Task RequiresLogin()
    {
        var response = await Factory.CreateClient().GetAsync("/api/progress/topics");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Health_IsHealthyWhenTheDatabaseIsReachable()
    {
        var response = await Factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }
}

[Collection(PostgresCollection.Name)]
public class RateLimitTests : IAsyncLifetime
{
    private readonly ApiFactory _factory;
    private readonly string _connectionString;

    public RateLimitTests(PostgresFixture postgres)
    {
        _connectionString = postgres.NewDatabaseConnectionString();
        _factory = new ApiFactory(_connectionString, overrides: new()
        {
            ["RateLimiting:AiRequestsPerMinute"] = "2",
            ["RateLimiting:AuthRequestsPerMinute"] = "4"
        });
    }

    public async Task InitializeAsync()
    {
        await using var db = PostgresFixture.CreateContext(_connectionString);
        await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.MigrateAsync(db.Database);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();

    private async Task<HttpClient> RegisterAsync(string email, string username)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, username, password = "secret123", fullName = "Student" });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    [Fact]
    public async Task AiCalls_AreLimitedPerStudent_WithA429Problem()
    {
        _factory.AiProvider.Reply(AnalysisReplies.Valid());
        var first = await RegisterAsync("one@example.com", "first1");
        var second = await RegisterAsync("two@example.com", "second2");
        var question = new { questionText = "She is ___ honest girl." };

        Assert.Equal(HttpStatusCode.OK, (await first.PostAsJsonAsync("/api/questions/analyze", question)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await first.PostAsJsonAsync("/api/questions/analyze", question)).StatusCode);
        var limited = await first.PostAsJsonAsync("/api/questions/analyze", question);

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal("application/problem+json", limited.Content.Headers.ContentType?.MediaType);
        var problem = await limited.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        Assert.Equal("You are going too fast. Please wait a minute and try again.", problem.GetProperty("message").GetString());
        Assert.True(limited.Headers.Contains("Retry-After"));
        Assert.Equal(2, _factory.AiProvider.Requests.Count);

        // Another student has their own allowance, and non-AI endpoints are not limited
        Assert.Equal(HttpStatusCode.OK, (await second.PostAsJsonAsync("/api/questions/analyze", question)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await first.GetAsync("/api/questions/history")).StatusCode);
    }

    [Fact]
    public async Task LoginAttempts_AreLimited()
    {
        await RegisterAsync("student@example.com", "student");
        var client = _factory.CreateClient();
        var wrong = new { email = "student@example.com", password = "wrong-password" };

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 4; i++)
            statuses.Add((await client.PostAsJsonAsync("/api/auth/login", wrong)).StatusCode);

        // Registration used 1 of the 4 permits for this address
        Assert.Equal(new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Unauthorized, HttpStatusCode.Unauthorized, HttpStatusCode.TooManyRequests }, statuses);
    }
}

using System.Net;
using System.Net.Http.Json;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Fakes;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Integration;

public class QuestionsApiTests : ApiTestBase
{
    public QuestionsApiTests(PostgresFixture postgres) : base(postgres) { }

    private static object Question(string text = "Fill in the gap: She is ___ honest girl.", string? topicCode = null, string? studentAnswer = null) =>
        new { questionText = text, topicCode, studentAnswer };

    [Fact]
    public async Task Topics_AreListedWithoutLoggingIn()
    {
        var topics = await Factory.CreateClient().GetFromJsonAsync<List<TopicDto>>("/api/topics");

        Assert.Equal(GrammarTopicSeed.All.Select(t => t.Code), topics!.Select(t => t.Code));
        Assert.Equal("আর্টিকেল", topics![0].NameBn);
    }

    [Fact]
    public async Task Analyze_ReturnsBilingualAnalysis_AndSavesIt()
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid());
        var (client, auth) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question());

        response.EnsureSuccessStatusCode();
        var analysis = (await response.Content.ReadFromJsonAsync<QuestionAnalysisDto>())!;
        Assert.Equal("articles", analysis.Topic.Code);
        Assert.Equal("an", analysis.CorrectAnswer);
        Assert.Equal(2, analysis.Steps.Count);
        Assert.True(QuestionAnalysisPrompt.ContainsBangla(analysis.Steps[0].Bn));
        Assert.Equal("Use \"an\" before a vowel sound.", analysis.Rule.En);
        Assert.Single(analysis.CommonMistakes);
        Assert.Null(analysis.StudentAnswer);

        await using var db = CreateDbContext();
        var saved = await db.QuestionAnalyses.SingleAsync();
        Assert.Equal(auth.User!.Id, saved.UserId);
        Assert.Equal("Fake", saved.AiProvider);
        Assert.Equal("fake-model-1", saved.AiModel);
        Assert.Equal(QuestionAnalysisPrompt.Version, saved.PromptVersion);

        var request = Assert.Single(Factory.AiProvider.Requests);
        Assert.True(request.JsonResponse);
        Assert.Contains("She is ___ honest girl.", request.Prompt);
    }

    [Fact]
    public async Task Analyze_WithStudentAnswer_ReturnsFeedback()
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid(studentAnswerIsCorrect: false));
        var (client, _) = await RegisterAsync();

        var analysis = await (await client.PostAsJsonAsync("/api/questions/analyze", Question(studentAnswer: " a ")))
            .Content.ReadFromJsonAsync<QuestionAnalysisDto>();

        Assert.NotNull(analysis!.StudentAnswer);
        Assert.Equal("a", analysis.StudentAnswer!.Answer);
        Assert.False(analysis.StudentAnswer.IsCorrect);
        Assert.True(QuestionAnalysisPrompt.ContainsBangla(analysis.StudentAnswer.Bn));
    }

    [Fact]
    public async Task Analyze_StudentsTopicChoiceWinsOverTheAiGuess()
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid(topicCode: "articles"));
        var (client, _) = await RegisterAsync();

        var analysis = await (await client.PostAsJsonAsync("/api/questions/analyze", Question(topicCode: "prepositions")))
            .Content.ReadFromJsonAsync<QuestionAnalysisDto>();

        Assert.Equal("prepositions", analysis!.Topic.Code);
    }

    [Fact]
    public async Task Analyze_InvalidFirstReply_IsRetriedWithTheProblems()
    {
        Factory.AiProvider.Reply(AnalysisReplies.WithoutBangla(), AnalysisReplies.Valid());
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question());

        response.EnsureSuccessStatusCode();
        Assert.Equal(2, Factory.AiProvider.Requests.Count);
        Assert.Contains("must be written in Bangla script", Factory.AiProvider.Requests[1].Prompt);
    }

    [Fact]
    public async Task Analyze_TwoInvalidReplies_Returns503_AndSavesNothing()
    {
        Factory.AiProvider.Reply("not json", AnalysisReplies.WithoutBangla());
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question());

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(AIServiceException.UnexpectedResponseMessage, (await ReadProblemAsync(response)).GetProperty("message").GetString());
        Assert.Equal(2, Factory.AiProvider.Requests.Count);
        await using var db = CreateDbContext();
        Assert.Equal(0, await db.QuestionAnalyses.CountAsync());
    }

    [Fact]
    public async Task Analyze_ProviderUnavailable_Returns503()
    {
        Factory.AiProvider.Throw(new AIServiceException(AIServiceException.UnavailableMessage));
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question());

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(AIServiceException.UnavailableMessage, (await ReadProblemAsync(response)).GetProperty("message").GetString());
    }

    [Fact]
    public async Task Analyze_UnknownTopic_Returns400_WithoutCallingTheAi()
    {
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question(topicCode: "astrology"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Unknown topic 'astrology'", (await ReadProblemAsync(response)).GetProperty("message").GetString());
        Assert.Empty(Factory.AiProvider.Requests);
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]
    public async Task Analyze_TooShortQuestion_Returns400(string text)
    {
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question(text));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(Factory.AiProvider.Requests);
    }

    [Fact]
    public async Task Analyze_TooLongQuestion_Returns400()
    {
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/questions/analyze", Question(new string('x', 2001)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Analyze_RequiresLogin()
    {
        var response = await Factory.CreateClient().PostAsJsonAsync("/api/questions/analyze", Question());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task History_IsNewestFirst_Paged_AndFilterableByTopic()
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid("articles"));
        var (client, _) = await RegisterAsync();
        await client.PostAsJsonAsync("/api/questions/analyze", Question("first question"));
        await client.PostAsJsonAsync("/api/questions/analyze", Question("second question"));
        await client.PostAsJsonAsync("/api/questions/analyze", Question("third question", topicCode: "narration"));

        var page1 = await client.GetFromJsonAsync<PagedResultDto<QuestionAnalysisSummaryDto>>("/api/questions/history?page=1&pageSize=2");
        var page2 = await client.GetFromJsonAsync<PagedResultDto<QuestionAnalysisSummaryDto>>("/api/questions/history?page=2&pageSize=2");
        var narration = await client.GetFromJsonAsync<PagedResultDto<QuestionAnalysisSummaryDto>>("/api/questions/history?topic=narration");
        var unknown = await client.GetFromJsonAsync<PagedResultDto<QuestionAnalysisSummaryDto>>("/api/questions/history?topic=astrology");

        Assert.Equal(3, page1!.TotalCount);
        Assert.Equal(new[] { "third question", "second question" }, page1.Items.Select(i => i.QuestionText));
        Assert.Equal("first question", Assert.Single(page2!.Items).QuestionText);
        Assert.Equal("third question", Assert.Single(narration!.Items).QuestionText);
        Assert.Equal(0, unknown!.TotalCount);
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=51")]
    public async Task History_InvalidPaging_Returns400(string query)
    {
        var (client, _) = await RegisterAsync();

        var response = await client.GetAsync($"/api/questions/history?{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await ReadProblemAsync(response);
    }

    [Fact]
    public async Task Analyses_ArePrivateToTheirOwner()
    {
        Factory.AiProvider.Reply(AnalysisReplies.Valid());
        var (owner, _) = await RegisterAsync(email: "owner@example.com", username: "owner");
        var (other, _) = await RegisterAsync(email: "other@example.com", username: "other");
        var analysis = await (await owner.PostAsJsonAsync("/api/questions/analyze", Question()))
            .Content.ReadFromJsonAsync<QuestionAnalysisDto>();

        var ownView = await owner.GetFromJsonAsync<QuestionAnalysisDto>($"/api/questions/{analysis!.Id}");
        Assert.Equal(analysis.Steps.Count, ownView!.Steps.Count);

        var otherView = await other.GetAsync($"/api/questions/{analysis.Id}");
        Assert.Equal(HttpStatusCode.NotFound, otherView.StatusCode);
        Assert.Equal("Question not found", (await ReadProblemAsync(otherView)).GetProperty("message").GetString());

        var otherHistory = await other.GetFromJsonAsync<PagedResultDto<QuestionAnalysisSummaryDto>>("/api/questions/history");
        Assert.Equal(0, otherHistory!.TotalCount);
    }
}

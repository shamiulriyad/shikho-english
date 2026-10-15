using System.Net;
using System.Net.Http.Json;
using Backend.DTOs;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Integration;

public class ErrorHandlingTests : ApiTestBase
{
    public ErrorHandlingTests(PostgresFixture postgres) : base(postgres) { }

    [Fact]
    public async Task PracticeSubmit_Succeeds_AndAppearsInHistory()
    {
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/practice/submit", new { sentence = "She is an honest girl." });

        response.EnsureSuccessStatusCode();
        var practice = await response.Content.ReadFromJsonAsync<PracticeResponseDto>();
        Assert.True(practice!.Id > 0);

        var history = await client.GetFromJsonAsync<List<PracticeResponseDto>>("/api/practice/history");
        Assert.Equal(practice.Id, Assert.Single(history!).Id);
    }

    [Fact]
    public async Task AiFailure_Returns503Problem_WithCorsHeadersIntact()
    {
        Factory.Ai.CorrectSentenceHandler = _ =>
            throw new AIServiceException("The AI service is currently unavailable. Please try again later.");
        var (client, _) = await RegisterAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/practice/submit")
        {
            Content = JsonContent.Create(new { sentence = "a apple" })
        };
        request.Headers.Add("Origin", "http://localhost:3000");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await ReadProblemAsync(response);
        Assert.Equal("The AI service is currently unavailable. Please try again later.", problem.GetProperty("message").GetString());
        // Without CORS headers the browser would hide this message from the frontend
        Assert.Equal("http://localhost:3000", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task QuizGenerationFailure_Returns503Problem_AndSavesNoQuiz()
    {
        Factory.Ai.QuizQuestionHandler = _ => "not json";
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsync("/api/quiz/create?numberOfQuestions=2", null);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        await ReadProblemAsync(response);
        await using var db = CreateDbContext();
        Assert.Equal(0, await db.Quizzes.CountAsync());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task QuizCreate_InvalidQuestionCount_Returns400Problem_WithOriginalMessage(int count)
    {
        var (client, _) = await RegisterAsync();

        var response = await client.PostAsync($"/api/quiz/create?numberOfQuestions={count}", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadProblemAsync(response);
        Assert.Equal("numberOfQuestions must be between 1 and 10", problem.GetProperty("message").GetString());
    }

    [Fact]
    public async Task PersistenceFailure_Returns500Problem_InsteadOfFakeSuccess()
    {
        // A valid token for a user that no longer exists makes the insert violate the foreign key.
        // Previously the failure was swallowed and the API answered 200 with an unsaved result (id 0).
        var (client, auth) = await RegisterAsync();
        await using (var db = CreateDbContext())
        {
            await db.Users.Where(u => u.Id == auth.User!.Id).ExecuteDeleteAsync();
        }

        var response = await client.PostAsJsonAsync("/api/practice/submit", new { sentence = "She is an honest girl." });

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var problem = await ReadProblemAsync(response);
        var body = problem.GetRawText();
        Assert.DoesNotContain("foreign key", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Exception", body);
    }

    [Fact]
    public async Task QuizFlow_CreateAnswerAndRead()
    {
        var (client, _) = await RegisterAsync();

        var quiz = await (await client.PostAsync("/api/quiz/create?numberOfQuestions=1", null))
            .Content.ReadFromJsonAsync<QuizDto>();
        Assert.Null(quiz!.Questions[0].CorrectAnswer);

        var answered = await (await client.PostAsJsonAsync($"/api/quiz/{quiz.Id}/answer",
            new { questionId = quiz.Questions[0].Id, answer = "an" })).Content.ReadFromJsonAsync<QuizDto>();

        Assert.True(answered!.IsCompleted);
        Assert.Equal(1, answered.Score);
        Assert.Equal("an", answered.Questions[0].CorrectAnswer);

        var progress = await client.GetFromJsonAsync<UserProgressDto>("/api/practice/progress");
        Assert.Equal(1, progress!.TotalQuizzes);
        Assert.Equal(100, progress.AverageQuizScore);
    }
}

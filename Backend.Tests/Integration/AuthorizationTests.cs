using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Backend.DTOs;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Tests.Integration;

public class AuthorizationTests : ApiTestBase
{
    public AuthorizationTests(PostgresFixture postgres) : base(postgres) { }

    [Theory]
    [InlineData("GET", "/api/practice/history")]
    [InlineData("GET", "/api/practice/progress")]
    [InlineData("POST", "/api/practice/submit")]
    [InlineData("POST", "/api/quiz/create")]
    [InlineData("GET", "/api/quiz/1")]
    [InlineData("GET", "/api/quiz/user/all")]
    public async Task ProtectedEndpoints_WithoutToken_Return401(string method, string url)
    {
        var response = await Factory.CreateClient().SendAsync(new HttpRequestMessage(new HttpMethod(method), url));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TokenSignedWithAnotherKey_Returns401()
    {
        var forged = new JwtSecurityToken(
            issuer: "GrammarLearner",
            audience: "GrammarLearnerUsers",
            claims: new[] { new Claim(ClaimTypes.NameIdentifier, "1") },
            expires: DateTime.UtcNow.AddMinutes(10),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-super-secret-jwt-key-min-32-characters-long!!!")),
                SecurityAlgorithms.HmacSha256));

        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(forged));

        var response = await client.GetAsync("/api/practice/history");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AnotherUsersQuiz_Returns404Problem()
    {
        var (owner, _) = await RegisterAsync(email: "owner@example.com", username: "owner");
        var (intruder, _) = await RegisterAsync(email: "intruder@example.com", username: "intruder");

        var quiz = await (await owner.PostAsync("/api/quiz/create?numberOfQuestions=1", null))
            .Content.ReadFromJsonAsync<QuizDto>();

        var get = await intruder.GetAsync($"/api/quiz/{quiz!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
        Assert.Equal("Quiz not found", (await ReadProblemAsync(get)).GetProperty("message").GetString());

        var answer = await intruder.PostAsJsonAsync($"/api/quiz/{quiz.Id}/answer",
            new { questionId = quiz.Questions[0].Id, answer = "an" });
        Assert.Equal(HttpStatusCode.NotFound, answer.StatusCode);
        Assert.Equal("Quiz or question not found", (await ReadProblemAsync(answer)).GetProperty("message").GetString());

        var intruderQuizzes = await intruder.GetFromJsonAsync<List<QuizDto>>("/api/quiz/user/all");
        Assert.Empty(intruderQuizzes!);
    }
}

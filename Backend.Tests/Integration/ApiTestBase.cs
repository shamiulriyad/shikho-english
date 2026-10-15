using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Backend.Data;
using Backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Integration;

[Collection(PostgresCollection.Name)]
public abstract class ApiTestBase : IAsyncLifetime
{
    protected ApiTestBase(PostgresFixture postgres)
    {
        ConnectionString = postgres.NewDatabaseConnectionString();
        Factory = new ApiFactory(ConnectionString);
    }

    protected string ConnectionString { get; }
    protected ApiFactory Factory { get; }

    public async Task InitializeAsync()
    {
        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await Factory.DisposeAsync();

    protected AppDbContext CreateDbContext() => PostgresFixture.CreateContext(ConnectionString);

    protected async Task<(HttpClient Client, AuthResponseDto Auth)> RegisterAsync(string email = "student@example.com", string username = "student")
    {
        var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            username,
            password = "secret123",
            fullName = "Test Student"
        });
        response.EnsureSuccessStatusCode();

        var auth = (await response.Content.ReadFromJsonAsync<AuthResponseDto>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return (client, auth);
    }

    protected static async Task<JsonElement> ReadProblemAsync(HttpResponseMessage response)
    {
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal((int)response.StatusCode, problem.GetProperty("status").GetInt32());
        Assert.True(problem.TryGetProperty("message", out _), "ProblemDetails should keep the legacy 'message' field");
        Assert.True(problem.TryGetProperty("traceId", out _));
        return problem;
    }
}

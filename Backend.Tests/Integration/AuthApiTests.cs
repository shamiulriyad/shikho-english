using System.Net;
using System.Net.Http.Json;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Tests.Integration;

public class AuthApiTests : ApiTestBase
{
    public AuthApiTests(PostgresFixture postgres) : base(postgres) { }

    [Fact]
    public async Task Register_ReturnsTokenAndNormalizedEmail()
    {
        var (_, auth) = await RegisterAsync(email: "  New.Student@Example.COM ");

        Assert.True(auth.Success);
        Assert.False(string.IsNullOrEmpty(auth.Token));
        Assert.Equal("new.student@example.com", auth.User!.Email);
    }

    [Fact]
    public async Task Register_EmailDifferingOnlyByCase_Returns400Problem()
    {
        await RegisterAsync(email: "student@example.com", username: "first");

        var response = await Factory.CreateClient().PostAsJsonAsync("/api/auth/register", new
        {
            email = "STUDENT@example.com",
            username = "second",
            password = "secret123",
            fullName = "Other"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadProblemAsync(response);
        Assert.Equal("Email already exists", problem.GetProperty("message").GetString());
    }

    [Fact]
    public async Task Register_InvalidBody_Returns400ValidationProblem()
    {
        var response = await Factory.CreateClient().PostAsJsonAsync("/api/auth/register", new
        {
            email = "not-an-email",
            username = "ab",
            password = "123",
            fullName = ""
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadProblemAsync(response);
        Assert.True(problem.GetProperty("errors").TryGetProperty("Email", out _));
    }

    [Fact]
    public async Task Login_IsCaseInsensitiveForEmail()
    {
        await RegisterAsync(email: "student@example.com");

        var response = await Factory.CreateClient().PostAsJsonAsync("/api/auth/login", new
        {
            email = "Student@EXAMPLE.com",
            password = "secret123"
        });

        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.False(string.IsNullOrEmpty(auth!.Token));
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401Problem()
    {
        await RegisterAsync();

        var response = await Factory.CreateClient().PostAsJsonAsync("/api/auth/login", new
        {
            email = "student@example.com",
            password = "wrong-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var problem = await ReadProblemAsync(response);
        Assert.Equal("Invalid email or password", problem.GetProperty("message").GetString());
    }

    [Fact]
    public async Task Database_RejectsCaseVariantEmailEvenWhenTheApiIsBypassed()
    {
        await RegisterAsync(email: "student@example.com");

        await using var db = CreateDbContext();
        db.Users.Add(new User { Email = " Student@Example.com", Username = "bypass", PasswordHash = "x", FullName = "x" });

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        var postgres = Assert.IsType<PostgresException>(error.InnerException);
        Assert.Equal(PostgresErrorCodes.UniqueViolation, postgres.SqlState);
        Assert.Equal("IX_Users_NormalizedEmail", postgres.ConstraintName);
    }
}

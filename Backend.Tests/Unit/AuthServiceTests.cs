using Backend.DTOs;
using Backend.Models;
using Backend.Options;
using Backend.Services;
using Backend.Tests.Fakes;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Tests.Unit;

public class AuthServiceTests
{
    private readonly InMemoryUserRepository _users = new();
    private readonly PasswordHasher<User> _hasher = new();
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        var jwt = new JwtTokenService(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            Secret = "unit-test-signing-key-that-is-at-least-32-bytes",
            Issuer = "TestIssuer",
            Audience = "TestAudience"
        }));
        _service = new AuthService(_users, jwt, _hasher);
    }

    private static UserRegisterDto Registration(string email = "Student@Example.com", string username = "student") => new()
    {
        Email = email,
        Username = username,
        Password = "secret123",
        FullName = "Test Student"
    };

    [Fact]
    public async Task Register_StoresNormalizedEmail_AndReturnsToken()
    {
        var result = await _service.Register(Registration(email: "  Student@Example.COM "));

        Assert.True(result.Success);
        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.Equal("student@example.com", result.User!.Email);
        Assert.Equal("student@example.com", _users.Saved.Single().Email);
    }

    [Fact]
    public async Task Register_HashesPassword()
    {
        await _service.Register(Registration());

        var user = _users.Saved.Single();
        Assert.NotEqual("secret123", user.PasswordHash);
        Assert.Equal(PasswordVerificationResult.Success, _hasher.VerifyHashedPassword(user, user.PasswordHash, "secret123"));
    }

    [Fact]
    public async Task Register_EmailDifferingOnlyByCase_IsRejected()
    {
        await _service.Register(Registration(email: "student@example.com", username: "first"));

        var result = await _service.Register(Registration(email: "STUDENT@example.com", username: "second"));

        Assert.False(result.Success);
        Assert.Equal("Email already exists", result.Message);
        Assert.Single(_users.Saved);
    }

    [Fact]
    public async Task Register_DuplicateUsername_IsRejected()
    {
        await _service.Register(Registration(email: "one@example.com"));

        var result = await _service.Register(Registration(email: "two@example.com"));

        Assert.False(result.Success);
        Assert.Equal("Username already exists", result.Message);
    }

    [Theory]
    [InlineData("IX_Users_NormalizedEmail", "Email already exists")]
    [InlineData("IX_Users_Email", "Email already exists")]
    [InlineData("IX_Users_Username", "Username already exists")]
    public async Task Register_LosingAConcurrentInsertRace_ReturnsFailureInsteadOfThrowing(string constraint, string expectedMessage)
    {
        _users.SaveException = new DbUpdateException("insert failed", new PostgresException(
            "duplicate key value violates unique constraint", "ERROR", "ERROR", PostgresErrorCodes.UniqueViolation,
            constraintName: constraint));

        var result = await _service.Register(Registration());

        Assert.False(result.Success);
        Assert.Equal(expectedMessage, result.Message);
    }

    [Fact]
    public async Task Register_OtherDatabaseFailure_Propagates()
    {
        _users.SaveException = new DbUpdateException("connection lost");

        await Assert.ThrowsAsync<DbUpdateException>(() => _service.Register(Registration()));
    }

    [Fact]
    public async Task Login_IsCaseAndWhitespaceInsensitiveForEmail()
    {
        await _service.Register(Registration(email: "student@example.com"));

        var result = await _service.Login(new UserLoginDto { Email = " STUDENT@Example.com ", Password = "secret123" });

        Assert.True(result.Success);
        Assert.NotNull(_users.Saved.Single().LastLoginAt);
    }

    [Fact]
    public async Task Login_WrongPassword_Fails()
    {
        await _service.Register(Registration());

        var result = await _service.Login(new UserLoginDto { Email = "student@example.com", Password = "wrong-password" });

        Assert.False(result.Success);
        Assert.Equal("Invalid email or password", result.Message);
        Assert.Null(result.Token);
    }

    [Fact]
    public async Task Login_UnknownEmail_FailsWithSameMessage()
    {
        var result = await _service.Login(new UserLoginDto { Email = "nobody@example.com", Password = "secret123" });

        Assert.False(result.Success);
        Assert.Equal("Invalid email or password", result.Message);
    }

    [Fact]
    public async Task Login_InactiveUser_Fails()
    {
        await _service.Register(Registration());
        _users.Saved.Single().IsActive = false;

        var result = await _service.Login(new UserLoginDto { Email = "student@example.com", Password = "secret123" });

        Assert.False(result.Success);
        Assert.Equal("User account is inactive", result.Message);
    }
}

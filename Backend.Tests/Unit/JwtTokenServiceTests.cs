using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Models;
using Backend.Options;
using Backend.Services;

namespace Backend.Tests.Unit;

public class JwtTokenServiceTests
{
    private const string Secret = "unit-test-signing-key-that-is-at-least-32-bytes";

    private static JwtTokenService CreateService() =>
        new(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            Secret = Secret,
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpiryMinutes = 30
        }));

    [Fact]
    public void GenerateToken_ContainsUserClaims_IssuerAudienceAndExpiry()
    {
        var user = new User { Id = 42, Email = "student@example.com", Username = "student", FullName = "Test Student" };

        var before = DateTime.UtcNow;
        var token = new JwtSecurityTokenHandler().ReadJwtToken(CreateService().GenerateToken(user));

        Assert.Equal("TestIssuer", token.Issuer);
        Assert.Contains("TestAudience", token.Audiences);
        Assert.Equal("42", token.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal("student@example.com", token.Claims.First(c => c.Type == ClaimTypes.Email).Value);
        Assert.Equal("student", token.Claims.First(c => c.Type == ClaimTypes.Name).Value);
        Assert.Equal("Test Student", token.Claims.First(c => c.Type == "FullName").Value);
        Assert.InRange(token.ValidTo, before.AddMinutes(29), before.AddMinutes(31));
        Assert.Equal("HS256", token.Header.Alg);
    }
}

using Backend.Configuration;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Backend.Tests.Unit;

public class SupabaseConnectionTests
{
    private static IConfiguration Settings(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();

    private static Dictionary<string, string?> Complete() => new()
    {
        [SupabaseConnection.ProjectRefKey] = "abcdefghijklmnop",
        [SupabaseConnection.PoolerHostKey] = "aws-0-ap-south-1.pooler.supabase.com",
        [SupabaseConnection.PasswordKey] = "p@ss;word#$"
    };

    [Fact]
    public void Build_UsesTheSessionPoolerWithTheProjectUser()
    {
        var (connectionString, missing) = SupabaseConnection.Build(Settings(Complete()));

        Assert.Empty(missing);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        Assert.Equal("aws-0-ap-south-1.pooler.supabase.com", builder.Host);
        Assert.Equal(5432, builder.Port);
        Assert.Equal("postgres", builder.Database);
        Assert.Equal("postgres.abcdefghijklmnop", builder.Username);
        Assert.Equal("p@ss;word#$", builder.Password); // special characters survive quoting
        Assert.Equal(SslMode.Require, builder.SslMode);
        Assert.Null(builder.RootCertificate);
    }

    [Fact]
    public void Build_VerifyFull_AddsTheCertificate()
    {
        var settings = Complete();
        settings[SupabaseConnection.SslModeKey] = "verifyfull";
        settings[SupabaseConnection.CaCertificateKey] = "certs/supabase-ca.crt";
        settings[SupabaseConnection.PortKey] = "6543";
        settings[SupabaseConnection.DatabaseKey] = "other";

        var builder = new NpgsqlConnectionStringBuilder(SupabaseConnection.Build(Settings(settings)).ConnectionString);

        Assert.Equal(SslMode.VerifyFull, builder.SslMode);
        Assert.Equal("certs/supabase-ca.crt", builder.RootCertificate);
        Assert.Equal(6543, builder.Port);
        Assert.Equal("other", builder.Database);
    }

    [Theory]
    [InlineData(SupabaseConnection.ProjectRefKey)]
    [InlineData(SupabaseConnection.PoolerHostKey)]
    [InlineData(SupabaseConnection.PasswordKey)]
    public void Build_ListsMissingSettingsWithWhereToFindThem(string key)
    {
        var settings = Complete();
        settings[key] = "";

        var (connectionString, missing) = SupabaseConnection.Build(Settings(settings));

        Assert.Null(connectionString);
        var problem = Assert.Single(missing);
        Assert.StartsWith(key, problem);
        Assert.Contains("Supabase ->", problem);
    }

    [Theory]
    [InlineData(SupabaseConnection.SslModeKey, "Sometimes", "must be Require, VerifyCA or VerifyFull")]
    [InlineData(SupabaseConnection.PoolerHostKey, "postgresql://postgres:x@db.abc.supabase.co:5432/postgres", "only the host name")]
    public void Build_RejectsInvalidValues(string key, string value, string expected)
    {
        var settings = Complete();
        settings[key] = value;

        var (_, missing) = SupabaseConnection.Build(Settings(settings));

        Assert.Contains(missing, problem => problem.Contains(expected));
        Assert.DoesNotContain(missing, problem => problem.Contains("postgres:x@")); // never echo a pasted link
    }

    [Fact]
    public void IsConfigured_OnlyWhenASupabaseSettingIsFilledIn()
    {
        Assert.False(SupabaseConnection.IsConfigured(Settings(new())));
        Assert.False(SupabaseConnection.IsConfigured(Settings(new() { [SupabaseConnection.PoolerHostKey] = " " })));
        Assert.True(SupabaseConnection.IsConfigured(Settings(new() { [SupabaseConnection.ProjectRefKey] = "abc" })));
    }
}

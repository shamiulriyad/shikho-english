using Backend.Configuration;

namespace Backend.Tests.Unit;

// Changes process-wide environment variables, so these tests must not run in parallel with each other
[Collection(nameof(DotEnvFileTests))]
public class DotEnvFileTests
{
    [Fact]
    public void Parse_ReadsKeysValuesCommentsAndQuotes()
    {
        var values = DotEnvFile.Parse(new[]
        {
            "# comment",
            "",
            "Jwt__Secret=abc123",
            "ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Password=p=w",
            "Ai__Gemini__Model = \"gemini-test\" ",
            "QUOTED='single'",
            "EMPTY=",
            "not a setting"
        });

        Assert.Equal("abc123", values["Jwt__Secret"]);
        Assert.Equal("Host=localhost;Port=5432;Password=p=w", values["ConnectionStrings__DefaultConnection"]);
        Assert.Equal("gemini-test", values["Ai__Gemini__Model"]);
        Assert.Equal("single", values["QUOTED"]);
        Assert.Equal("", values["EMPTY"]);
        Assert.Equal(5, values.Count);
    }

    [Fact]
    public void LoadIntoEnvironment_SetsMissingVariables_ButRealOnesWin()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var path = Path.Combine(Path.GetTempPath(), $"dotenv-{suffix}.env");
        File.WriteAllLines(path, new[] { $"FROMFILE_{suffix}=file", $"ALREADYSET_{suffix}=file" });
        Environment.SetEnvironmentVariable($"ALREADYSET_{suffix}", "real");
        try
        {
            var applied = DotEnvFile.LoadIntoEnvironment(path);

            Assert.Equal("file", Environment.GetEnvironmentVariable($"FROMFILE_{suffix}"));
            Assert.Equal("real", Environment.GetEnvironmentVariable($"ALREADYSET_{suffix}"));
            Assert.Equal(new[] { $"FROMFILE_{suffix}" }, applied);
            Assert.Equal(path, DotEnvFile.LoadedFrom);
        }
        finally
        {
            Environment.SetEnvironmentVariable($"FROMFILE_{suffix}", null);
            Environment.SetEnvironmentVariable($"ALREADYSET_{suffix}", null);
            File.Delete(path);
        }
    }

    [Fact]
    public void Find_UsesTheExplicitPathWhenSet()
    {
        var path = Path.Combine(Path.GetTempPath(), $"explicit-{Guid.NewGuid():N}.env");
        File.WriteAllText(path, "X=1");
        Environment.SetEnvironmentVariable(DotEnvFile.PathVariable, path);
        try
        {
            Assert.Equal(Path.GetFullPath(path), DotEnvFile.Find());

            File.Delete(path);
            Assert.Null(DotEnvFile.Find()); // an explicit path that does not exist is not replaced by a search
        }
        finally
        {
            Environment.SetEnvironmentVariable(DotEnvFile.PathVariable, null);
            File.Delete(path);
        }
    }

    [Fact]
    public void TheTestSuiteNeverLoadsTheDevelopersEnvFile()
    {
        Assert.Equal("off", Environment.GetEnvironmentVariable(DotEnvFile.SwitchVariable));
    }
}

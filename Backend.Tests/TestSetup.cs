using System.Runtime.CompilerServices;
using Backend.Configuration;

namespace Backend.Tests;

internal static class TestSetup
{
    // Runs before any test: the developer's .env (real database, keys) must never reach the test suite
    [ModuleInitializer]
    internal static void IgnoreDeveloperEnvFile() =>
        Environment.SetEnvironmentVariable(DotEnvFile.SwitchVariable, "off");
}

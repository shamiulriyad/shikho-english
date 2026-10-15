namespace Backend.Configuration
{
    /// <summary>
    /// The project's single settings file: &lt;repository root&gt;/.env with KEY=VALUE lines.
    /// It is loaded into the process environment before the app starts, so it can set everything
    /// ASP.NET Core reads from environment variables (ASPNETCORE_ENVIRONMENT, ASPNETCORE_URLS,
    /// ConnectionStrings__DefaultConnection, Ai__Gemini__ApiKey, ...). Variables that are already set
    /// in the real environment always win.
    /// </summary>
    public static class DotEnvFile
    {
        public const string FileName = ".env";

        /// <summary>Set to a file path to use that file instead of searching for .env.</summary>
        public const string PathVariable = "SHIKHO_ENV_FILE";

        /// <summary>Set to "off" to skip the file entirely (the test suite does this).</summary>
        public const string SwitchVariable = "SHIKHO_DOTENV";

        /// <summary>The file that was loaded, or null.</summary>
        public static string? LoadedFrom { get; private set; }

        public static Dictionary<string, string> Parse(IEnumerable<string> lines)
        {
            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var rawLine in lines)
            {
                var line = rawLine.Trim();
                if (line.Length == 0 || line.StartsWith('#'))
                    continue;

                // Split on the first "=" only; connection strings contain more of them
                var separator = line.IndexOf('=');
                if (separator <= 0)
                    continue;

                var key = line[..separator].Trim();
                var value = line[(separator + 1)..].Trim();
                if (value.Length >= 2 && (value[0] == '"' && value[^1] == '"' || value[0] == '\'' && value[^1] == '\''))
                    value = value[1..^1];

                values[key] = value;
            }
            return values;
        }

        /// <summary>
        /// Finds the .env file: the SHIKHO_ENV_FILE path if set, otherwise the nearest .env in the
        /// current folder or its parents, then next to the app or its parents.
        /// </summary>
        public static string? Find()
        {
            var explicitPath = Environment.GetEnvironmentVariable(PathVariable);
            if (!string.IsNullOrWhiteSpace(explicitPath))
                return File.Exists(explicitPath) ? Path.GetFullPath(explicitPath) : null;

            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
            {
                for (var directory = new DirectoryInfo(start); directory != null; directory = directory.Parent)
                {
                    var candidate = Path.Combine(directory.FullName, FileName);
                    if (File.Exists(candidate))
                        return candidate;
                }
            }
            return null;
        }

        /// <summary>
        /// Copies the file's settings into the process environment, without replacing variables that
        /// are already set. Returns the names that were applied.
        /// </summary>
        public static IReadOnlyList<string> LoadIntoEnvironment(string path)
        {
            var applied = new List<string>();
            foreach (var (key, value) in Parse(File.ReadAllLines(path)))
            {
                if (Environment.GetEnvironmentVariable(key) != null)
                    continue;

                Environment.SetEnvironmentVariable(key, value);
                applied.Add(key);
            }
            LoadedFrom = path;
            return applied;
        }

        /// <summary>Loads the project's .env unless switched off. Call before the host is built.</summary>
        public static void LoadIfPresent()
        {
            if (string.Equals(Environment.GetEnvironmentVariable(SwitchVariable), "off", StringComparison.OrdinalIgnoreCase))
                return;

            var path = Find();
            if (path != null)
                LoadIntoEnvironment(path);
        }
    }
}

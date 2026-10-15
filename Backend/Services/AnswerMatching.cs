using System.Text.RegularExpressions;

namespace Backend.Services
{
    /// <summary>
    /// Deterministic answer check run before any AI call: an answer that matches an accepted answer
    /// apart from case, spacing, curly quotes or a trailing full stop is correct without asking the AI.
    /// </summary>
    public static partial class AnswerMatching
    {
        public static string Normalize(string answer)
        {
            var text = answer
                .Replace('‘', '\'').Replace('’', '\'')
                .Replace('“', '"').Replace('”', '"')
                .Trim()
                .TrimEnd('.', '!', '?', '।')
                .Trim()
                .ToLowerInvariant();
            return Whitespace().Replace(text, " ");
        }

        public static bool MatchesAny(string answer, IEnumerable<string> acceptedAnswers)
        {
            var normalized = Normalize(answer);
            return normalized.Length > 0 && acceptedAnswers.Any(accepted => Normalize(accepted) == normalized);
        }

        [GeneratedRegex(@"\s+")]
        private static partial Regex Whitespace();
    }
}

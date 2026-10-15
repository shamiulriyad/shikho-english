using Backend.Ai;

namespace Backend.Services
{
    /// <summary>
    /// Calls the AI for JSON and validates the reply; an invalid reply is retried once with its problems listed.
    /// </summary>
    public static class ValidatedAiCall
    {
        private const int MaxAttempts = 2;

        public static async Task<T> Run<T>(
            IAiProvider ai,
            ILogger logger,
            string purpose,
            string systemInstruction,
            string prompt,
            double temperature,
            Func<string, (T? Result, List<string> Problems)> parse,
            Func<string, IReadOnlyList<string>, string> buildRetry) where T : class
        {
            var attemptPrompt = prompt;
            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                var reply = await ai.GenerateAsync(new AiRequest(systemInstruction, attemptPrompt, JsonResponse: true, temperature));
                var (result, problems) = parse(reply);
                if (result != null)
                    return result;

                logger.LogWarning("{Provider} {Purpose} reply rejected on attempt {Attempt}: {Problems}",
                    ai.Name, purpose, attempt, string.Join("; ", problems));
                attemptPrompt = buildRetry(prompt, problems);
            }

            throw new AIServiceException(AIServiceException.UnexpectedResponseMessage);
        }
    }
}

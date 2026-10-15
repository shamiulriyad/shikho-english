using System.Text.Json;
using Backend.Ai;
using Backend.DTOs;

namespace Backend.Services
{
    /// <summary>
    /// Grammar prompts and response parsing. Which AI model answers is decided by the configured <see cref="IAiProvider"/>.
    /// </summary>
    public interface IGrammarAiService
    {
        Task<(string correctedSentence, List<MistakeDto> mistakes, string explanation)> CorrectSentence(string sentence);
        Task<string> GenerateQuizQuestion();
        Task<string> GetGrammarExplanation(string topic);
    }

    public class GrammarAiService : IGrammarAiService
    {
        private const string SystemInstruction = "You are a helpful English grammar teacher.";
        private const int MaxLoggedChars = 500;

        private readonly IAiProvider _provider;
        private readonly ILogger<GrammarAiService> _logger;

        public GrammarAiService(IAiProvider provider, ILogger<GrammarAiService> logger)
        {
            _provider = provider;
            _logger = logger;
        }

        public async Task<(string correctedSentence, List<MistakeDto> mistakes, string explanation)> CorrectSentence(string sentence)
        {
            var prompt = $@"You are an English grammar teacher focusing on articles (a, an, the).
Analyze this sentence and provide corrections if needed:
""""""{sentence}""""""

Respond in JSON format with:
{{
  ""correctedSentence"": ""corrected version of the sentence"",
  ""isCorrect"": true/false,
  ""mistakes"": [
    {{
      ""type"": ""article error"",
      ""original"": ""original text"",
      ""correction"": ""corrected text"",
      ""reason"": ""why this is wrong""
    }}
  ],
  ""explanation"": ""detailed explanation of the mistakes and grammar rules""
}}";

            var response = await _provider.GenerateAsync(new AiRequest(SystemInstruction, prompt, JsonResponse: true));
            return ParseCorrectionResponse(response);
        }

        public async Task<string> GenerateQuizQuestion()
        {
            var prompt = @"Generate a fill-in-the-blank quiz question about English articles (a, an, the).
The sentence must contain exactly one blank written as ___ where exactly one of a, an or the fits.
Respond as JSON:
{
  ""question"": ""short instruction, e.g. Choose the correct article"",
  ""incorrectSentence"": ""the sentence with ___ in place of the article"",
  ""correctAnswer"": ""a, an or the"",
  ""explanation"": ""explanation of the correct usage""
}";

            return await _provider.GenerateAsync(new AiRequest(SystemInstruction, prompt, JsonResponse: true));
        }

        public async Task<string> GetGrammarExplanation(string topic)
        {
            var prompt = $@"Provide a clear, concise explanation of this English grammar topic related to articles:
Topic: {topic}

Focus on practical examples and rules.";

            return await _provider.GenerateAsync(new AiRequest(SystemInstruction, prompt, JsonResponse: false));
        }

        private (string correctedSentence, List<MistakeDto> mistakes, string explanation) ParseCorrectionResponse(string jsonResponse)
        {
            try
            {
                var jsonDoc = JsonSerializer.Deserialize<JsonElement>(jsonResponse);

                var correctedSentence = jsonDoc.GetProperty("correctedSentence").GetString() ?? string.Empty;
                var explanation = jsonDoc.GetProperty("explanation").GetString() ?? string.Empty;

                var mistakes = new List<MistakeDto>();
                if (jsonDoc.TryGetProperty("mistakes", out var mistakesArray))
                {
                    foreach (var mistake in mistakesArray.EnumerateArray())
                    {
                        mistakes.Add(new MistakeDto
                        {
                            Type = mistake.GetProperty("type").GetString() ?? string.Empty,
                            Original = mistake.GetProperty("original").GetString() ?? string.Empty,
                            Correction = mistake.GetProperty("correction").GetString() ?? string.Empty,
                            Reason = mistake.GetProperty("reason").GetString() ?? string.Empty
                        });
                    }
                }

                return (correctedSentence, mistakes, explanation);
            }
            catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException)
            {
                var logged = jsonResponse.Length <= MaxLoggedChars ? jsonResponse : jsonResponse[..MaxLoggedChars] + "…";
                _logger.LogError(ex, "Could not parse {Provider} correction response: {Response}", _provider.Name, logged);
                throw new AIServiceException(AIServiceException.UnexpectedResponseMessage, ex);
            }
        }
    }
}

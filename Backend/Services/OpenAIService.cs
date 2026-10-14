using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.DTOs;

namespace Backend.Services
{
    public interface IOpenAIService
    {
        Task<(string correctedSentence, List<MistakeDto> mistakes, string explanation)> CorrectSentence(string sentence);
        Task<string> GenerateQuizQuestion();
        Task<string> GetGrammarExplanation(string topic);
    }

    public class AIServiceException : Exception
    {
        public AIServiceException(string message, Exception? innerException = null) : base(message, innerException) { }
    }

    public class OpenAIService : IOpenAIService
    {
        private const string ApiUrl = "https://api.openai.com/v1/chat/completions";

        private readonly HttpClient _httpClient;
        private readonly ILogger<OpenAIService> _logger;
        private readonly string _apiKey;
        private readonly string _model;

        public OpenAIService(HttpClient httpClient, IConfiguration configuration, ILogger<OpenAIService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["OpenAI:ApiKey"] ?? throw new InvalidOperationException("OpenAI API key not configured");
            _model = configuration["OpenAI:Model"] ?? "gpt-4o-mini";
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

            var response = await CallOpenAI(prompt, jsonResponse: true);
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

            return await CallOpenAI(prompt, jsonResponse: true);
        }

        public async Task<string> GetGrammarExplanation(string topic)
        {
            var prompt = $@"Provide a clear, concise explanation of this English grammar topic related to articles:
Topic: {topic}

Focus on practical examples and rules.";

            return await CallOpenAI(prompt, jsonResponse: false);
        }

        private async Task<string> CallOpenAI(string prompt, bool jsonResponse)
        {
            var request = new Dictionary<string, object>
            {
                ["model"] = _model,
                ["messages"] = new[]
                {
                    new { role = "system", content = "You are a helpful English grammar teacher." },
                    new { role = "user", content = prompt }
                },
                ["temperature"] = 0.7,
                ["max_tokens"] = 1000
            };
            if (jsonResponse)
            {
                request["response_format"] = new { type = "json_object" };
            }

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, ApiUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            try
            {
                using var response = await _httpClient.SendAsync(httpRequest);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("OpenAI request failed with {StatusCode}: {Body}", (int)response.StatusCode, responseBody);
                    throw new AIServiceException("The AI service is currently unavailable. Please try again later.");
                }

                var jsonDoc = JsonSerializer.Deserialize<JsonElement>(responseBody);
                return jsonDoc.GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? string.Empty;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Could not reach OpenAI");
                throw new AIServiceException("The AI service is currently unavailable. Please try again later.", ex);
            }
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
                _logger.LogError(ex, "Could not parse OpenAI correction response: {Response}", jsonResponse);
                throw new AIServiceException("The AI returned an unexpected response. Please try again.", ex);
            }
        }
    }
}

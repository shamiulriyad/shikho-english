using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Backend.Options;
using Backend.Services;

namespace Backend.Ai
{
    /// <summary>
    /// Google Gemini via the REST generateContent endpoint.
    /// The key travels in the x-goog-api-key header, never in the URL, so it cannot end up in request logs.
    /// </summary>
    public class GeminiProvider : HttpAiProvider
    {
        private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

        private readonly AiProviderOptions _options;

        public GeminiProvider(HttpClient httpClient, IOptions<AiOptions> options, ILogger<GeminiProvider> logger)
            : base(httpClient, logger)
        {
            _options = options.Value.Gemini;
        }

        public override string Name => AiOptions.GeminiProvider;

        public override string Model => _options.Model;

        public override async Task<string> GenerateAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            EnsureConfigured(_options.IsConfigured);

            var generationConfig = new Dictionary<string, object>
            {
                ["temperature"] = request.Temperature,
                ["maxOutputTokens"] = _options.MaxOutputTokens
            };
            if (request.JsonResponse)
            {
                generationConfig["responseMimeType"] = "application/json";
            }

            var body = new
            {
                systemInstruction = new { parts = new[] { new { text = request.SystemInstruction } } },
                contents = new[] { new { role = "user", parts = new[] { new { text = request.Prompt } } } },
                generationConfig
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}{Uri.EscapeDataString(_options.Model)}:generateContent")
            {
                Content = JsonBody(body)
            };
            httpRequest.Headers.Add("x-goog-api-key", _options.ApiKey);

            var response = await SendAsync(httpRequest, cancellationToken);
            return ExtractText(response);
        }

        private string ExtractText(JsonElement response)
        {
            // A blocked prompt comes back as 200 with no candidates
            if (response.TryGetProperty("promptFeedback", out var feedback) &&
                feedback.TryGetProperty("blockReason", out var blockReason))
            {
                Logger.LogWarning("Gemini blocked the prompt: {BlockReason}", blockReason.GetString());
                throw new AIServiceException(AIServiceException.BlockedMessage);
            }

            if (!response.TryGetProperty("candidates", out var candidates) ||
                candidates.ValueKind != JsonValueKind.Array ||
                candidates.GetArrayLength() == 0)
            {
                Logger.LogError("Gemini returned no candidates");
                throw new AIServiceException(AIServiceException.UnexpectedResponseMessage);
            }

            var candidate = candidates[0];
            var finishReason = candidate.TryGetProperty("finishReason", out var reason) ? reason.GetString() : null;
            if (finishReason != "STOP")
            {
                // MAX_TOKENS would hand back truncated JSON; SAFETY and the rest mean no usable answer
                Logger.LogWarning("Gemini stopped with finish reason {FinishReason}", finishReason ?? "(none)");
                throw new AIServiceException(finishReason is "SAFETY" or "PROHIBITED_CONTENT" or "BLOCKLIST" or "SPII"
                    ? AIServiceException.BlockedMessage
                    : AIServiceException.UnexpectedResponseMessage);
            }

            var text = new StringBuilder();
            if (candidate.TryGetProperty("content", out var content) &&
                content.TryGetProperty("parts", out var parts) &&
                parts.ValueKind == JsonValueKind.Array)
            {
                foreach (var part in parts.EnumerateArray())
                {
                    // Thought summaries are the model's reasoning, not the answer
                    if (part.TryGetProperty("thought", out var thought) && thought.ValueKind == JsonValueKind.True)
                        continue;

                    if (part.TryGetProperty("text", out var partText))
                        text.Append(partText.GetString());
                }
            }

            if (text.Length == 0)
            {
                Logger.LogError("Gemini returned a candidate without text");
                throw new AIServiceException(AIServiceException.UnexpectedResponseMessage);
            }

            return text.ToString();
        }
    }
}

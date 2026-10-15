using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Backend.Options;
using Backend.Services;

namespace Backend.Ai
{
    /// <summary>
    /// OpenAI Chat Completions. Secondary provider, selected with Ai:Provider = "OpenAI".
    /// </summary>
    public class OpenAIProvider : HttpAiProvider
    {
        private const string ApiUrl = "https://api.openai.com/v1/chat/completions";

        private readonly AiProviderOptions _options;

        public OpenAIProvider(HttpClient httpClient, IOptions<AiOptions> options, ILogger<OpenAIProvider> logger)
            : base(httpClient, logger)
        {
            _options = options.Value.OpenAI;
        }

        public override string Name => AiOptions.OpenAIProvider;

        public override string Model => _options.Model;

        public override async Task<string> GenerateAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            EnsureConfigured(_options.IsConfigured);

            var body = new Dictionary<string, object>
            {
                ["model"] = _options.Model,
                ["messages"] = new[]
                {
                    new { role = "system", content = request.SystemInstruction },
                    new { role = "user", content = request.Prompt }
                },
                ["temperature"] = request.Temperature,
                ["max_tokens"] = _options.MaxOutputTokens
            };
            if (request.JsonResponse)
            {
                body["response_format"] = new { type = "json_object" };
            }

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, ApiUrl) { Content = JsonBody(body) };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            var response = await SendAsync(httpRequest, cancellationToken);
            try
            {
                var content = response.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                if (!string.IsNullOrEmpty(content))
                    return content;
            }
            catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
            {
                Logger.LogError(ex, "OpenAI response did not have the expected shape");
                throw new AIServiceException(AIServiceException.UnexpectedResponseMessage, ex);
            }

            Logger.LogError("OpenAI returned an empty message");
            throw new AIServiceException(AIServiceException.UnexpectedResponseMessage);
        }
    }
}

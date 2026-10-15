using System.Text;
using System.Text.Json;
using Backend.Services;

namespace Backend.Ai
{
    /// <summary>
    /// Shared HTTP handling for AI providers: JSON requests, timeouts, network errors and safe logging.
    /// </summary>
    public abstract class HttpAiProvider : IAiProvider
    {
        // Enough of an error body or model output to diagnose a failure without flooding the logs
        private const int MaxLoggedChars = 500;

        protected HttpAiProvider(HttpClient httpClient, ILogger logger)
        {
            HttpClient = httpClient;
            Logger = logger;
        }

        public abstract string Name { get; }

        public abstract string Model { get; }

        protected HttpClient HttpClient { get; }
        protected ILogger Logger { get; }

        public abstract Task<string> GenerateAsync(AiRequest request, CancellationToken cancellationToken = default);

        protected static StringContent JsonBody(object body) =>
            new(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        /// <summary>Sends the request and returns the parsed JSON body of a successful response.</summary>
        protected async Task<JsonElement> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string responseBody;
            try
            {
                using var response = await HttpClient.SendAsync(request, cancellationToken);
                responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    Logger.LogError("{Provider} request failed with {StatusCode}: {Body}", Name, (int)response.StatusCode, Truncate(responseBody));
                    throw new AIServiceException(AIServiceException.UnavailableMessage);
                }
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                Logger.LogError("{Provider} request timed out after {Seconds}s", Name, HttpClient.Timeout.TotalSeconds);
                throw new AIServiceException(AIServiceException.UnavailableMessage, ex);
            }
            catch (HttpRequestException ex)
            {
                Logger.LogError(ex, "Could not reach {Provider}", Name);
                throw new AIServiceException(AIServiceException.UnavailableMessage, ex);
            }

            try
            {
                return JsonSerializer.Deserialize<JsonElement>(responseBody);
            }
            catch (JsonException ex)
            {
                Logger.LogError(ex, "{Provider} returned a body that is not JSON: {Body}", Name, Truncate(responseBody));
                throw new AIServiceException(AIServiceException.UnexpectedResponseMessage, ex);
            }
        }

        /// <summary>Called before any request is built; without a key there is nothing to send.</summary>
        protected void EnsureConfigured(bool isConfigured)
        {
            // Only possible in Development; other environments refuse to start without a key
            if (!isConfigured)
            {
                Logger.LogWarning("Ai:{Provider}:ApiKey is not configured; AI request skipped", Name);
                throw new AIServiceException(AIServiceException.UnavailableMessage);
            }
        }

        protected static string Truncate(string text) =>
            text.Length <= MaxLoggedChars ? text : text[..MaxLoggedChars] + "…";
    }
}

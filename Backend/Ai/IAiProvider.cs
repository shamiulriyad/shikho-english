namespace Backend.Ai
{
    /// <summary>
    /// One text-generation call. Student text goes in <see cref="Prompt"/>, never in the system instruction.
    /// </summary>
    public record AiRequest(string SystemInstruction, string Prompt, bool JsonResponse, double Temperature = 0.7);

    /// <summary>
    /// Transport to an AI model. Implementations only send the request and return the model's text;
    /// prompts and response parsing belong to the feature services that call them.
    /// </summary>
    public interface IAiProvider
    {
        string Name { get; }

        /// <summary>The configured model, recorded with saved AI output for auditing.</summary>
        string Model { get; }

        /// <exception cref="Backend.Services.AIServiceException">The provider is unavailable, misconfigured, or returned no usable answer.</exception>
        Task<string> GenerateAsync(AiRequest request, CancellationToken cancellationToken = default);
    }
}

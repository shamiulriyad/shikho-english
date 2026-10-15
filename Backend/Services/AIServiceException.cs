namespace Backend.Services
{
    /// <summary>
    /// An AI call failed. The message is safe to show to students; the cause is logged where it happened.
    /// </summary>
    public class AIServiceException : Exception
    {
        public const string UnavailableMessage = "The AI service is currently unavailable. Please try again later.";
        public const string UnexpectedResponseMessage = "The AI returned an unexpected response. Please try again.";
        public const string BlockedMessage = "The AI could not answer this request. Please rephrase it and try again.";

        public AIServiceException(string message, Exception? innerException = null) : base(message, innerException) { }
    }
}

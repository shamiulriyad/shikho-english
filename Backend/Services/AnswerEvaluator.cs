using System.Text.Json;
using Backend.Ai;
using Backend.Models;

namespace Backend.Services
{
    public record AnswerEvaluation(bool IsCorrect, string? FeedbackEn, string? FeedbackBn);

    public interface IAnswerEvaluator
    {
        /// <summary>Marks a typed answer to a practice-set question.</summary>
        /// <exception cref="AIServiceException">The answer needed the AI and the AI could not mark it.</exception>
        Task<AnswerEvaluation> Evaluate(QuizQuestion question, string answer);
    }

    public class AnswerEvaluator : IAnswerEvaluator
    {
        private const double Temperature = 0;

        private readonly IAiProvider _ai;
        private readonly ILogger<AnswerEvaluator> _logger;

        public AnswerEvaluator(IAiProvider ai, ILogger<AnswerEvaluator> logger)
        {
            _ai = ai;
            _logger = logger;
        }

        public async Task<AnswerEvaluation> Evaluate(QuizQuestion question, string answer)
        {
            var accepted = JsonSerializer.Deserialize<List<string>>(question.AcceptedAnswersJson ?? "[]") ?? new List<string>();

            // Exact matches need no AI call: faster, free and always consistent
            if (AnswerMatching.MatchesAny(answer, accepted))
                return new AnswerEvaluation(true, null, null);

            var result = await ValidatedAiCall.Run(
                _ai, _logger, "answer evaluation",
                AnswerEvaluationPrompt.SystemInstruction,
                AnswerEvaluationPrompt.Build(question.Question, question.IncorrectSentence, accepted, answer),
                Temperature,
                AnswerEvaluationPrompt.Parse,
                AnswerEvaluationPrompt.BuildRetry);

            return new AnswerEvaluation(result.IsCorrect, result.FeedbackEn, result.FeedbackBn);
        }
    }
}

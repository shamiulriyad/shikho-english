using System.Text.Json;
using Backend.Ai;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IPracticeSetService
    {
        /// <summary>Generates practice questions like an analysed question. Null when the analysis is not the user's.</summary>
        Task<QuizDto?> CreateFromAnalysis(int userId, int analysisId, int count);
    }

    public class PracticeSetService : IPracticeSetService
    {
        private const double Temperature = 0.7;

        private readonly IQuestionAnalysisRepository _analyses;
        private readonly IQuizRepository _quizzes;
        private readonly IAiProvider _ai;
        private readonly ILogger<PracticeSetService> _logger;

        public PracticeSetService(
            IQuestionAnalysisRepository analyses,
            IQuizRepository quizzes,
            IAiProvider ai,
            ILogger<PracticeSetService> logger)
        {
            _analyses = analyses;
            _quizzes = quizzes;
            _ai = ai;
            _logger = logger;
        }

        public async Task<QuizDto?> CreateFromAnalysis(int userId, int analysisId, int count)
        {
            var analysis = await _analyses.GetByIdForUser(analysisId, userId);
            if (analysis == null) return null;

            var topic = analysis.Topic!;
            var questions = await ValidatedAiCall.Run(
                _ai, _logger, "practice set",
                PracticeSetPrompt.SystemInstruction,
                PracticeSetPrompt.Build(analysis, topic, count),
                Temperature,
                reply => PracticeSetPrompt.Parse(reply, count, analysis.QuestionText),
                PracticeSetPrompt.BuildRetry);

            var quiz = new Quiz
            {
                UserId = userId,
                Title = $"Practice: {topic.NameEn}",
                TotalQuestions = questions.Count,
                TopicId = topic.Id,
                Topic = topic,
                SourceAnalysisId = analysis.Id
            };
            foreach (var generated in questions)
            {
                quiz.Questions.Add(new QuizQuestion
                {
                    Question = generated.Instruction,
                    IncorrectSentence = generated.Question,
                    CorrectAnswer = generated.AcceptedAnswers[0],
                    AcceptedAnswersJson = JsonSerializer.Serialize(generated.AcceptedAnswers),
                    Explanation = generated.Explanation.En,
                    ExplanationBn = generated.Explanation.Bn
                });
            }

            await _quizzes.Add(quiz);
            await _quizzes.SaveChanges();

            return QuizMapper.ToDto(quiz);
        }
    }
}

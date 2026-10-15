using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IQuizService
    {
        Task<QuizDto> CreateQuiz(int userId, int numberOfQuestions = 5);
        Task<QuizDto?> SubmitQuizAnswer(int userId, int quizId, int questionId, string answer);
        Task<QuizDto?> GetQuiz(int userId, int quizId);
        Task<IEnumerable<QuizDto>> GetUserQuizzes(int userId);
    }

    public class QuizService : IQuizService
    {
        private readonly IQuizRepository _quizRepository;
        private readonly IGrammarAiService _grammarAi;
        private readonly IAnswerEvaluator _answerEvaluator;

        public QuizService(IQuizRepository quizRepository, IGrammarAiService grammarAi, IAnswerEvaluator answerEvaluator)
        {
            _quizRepository = quizRepository;
            _grammarAi = grammarAi;
            _answerEvaluator = answerEvaluator;
        }

        public async Task<QuizDto> CreateQuiz(int userId, int numberOfQuestions = 5)
        {
            var quiz = new Quiz
            {
                UserId = userId,
                Title = $"Grammar Quiz - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                TotalQuestions = numberOfQuestions,
                IsCompleted = false
            };

            // Generate all questions first so a failing AI call doesn't leave an empty quiz behind
            for (int i = 0; i < numberOfQuestions; i++)
            {
                var questionJson = await _grammarAi.GenerateQuizQuestion();
                quiz.Questions.Add(ParseQuizQuestion(questionJson));
            }

            await _quizRepository.Add(quiz);
            await _quizRepository.SaveChanges();

            return QuizMapper.ToDto(quiz);
        }

        public async Task<QuizDto?> SubmitQuizAnswer(int userId, int quizId, int questionId, string answer)
        {
            var quiz = await _quizRepository.GetByIdWithQuestions(quizId);
            if (quiz == null || quiz.UserId != userId) return null;

            var question = quiz.Questions.FirstOrDefault(q => q.Id == questionId);
            if (question == null) return null;

            // Ignore repeat answers so the score can't be inflated
            if (!string.IsNullOrEmpty(question.UserAnswer))
                return QuizMapper.ToDto(quiz);

            var trimmedAnswer = answer.Trim();
            if (question.AcceptedAnswersJson == null)
            {
                question.IsAnsweredCorrectly = trimmedAnswer.Equals(question.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase);
            }
            else
            {
                // May call the AI; if it is unavailable nothing is recorded and the student can try again
                var evaluation = await _answerEvaluator.Evaluate(question, trimmedAnswer);
                question.IsAnsweredCorrectly = evaluation.IsCorrect;
                question.FeedbackEn = evaluation.FeedbackEn;
                question.FeedbackBn = evaluation.FeedbackBn;
            }
            question.UserAnswer = trimmedAnswer;

            if (question.IsAnsweredCorrectly)
            {
                quiz.Score++;
            }

            if (quiz.Questions.All(q => !string.IsNullOrEmpty(q.UserAnswer)))
            {
                quiz.IsCompleted = true;
                quiz.CompletedAt = DateTime.UtcNow;
            }

            try
            {
                await _quizRepository.SaveChanges();
            }
            catch (DbUpdateConcurrencyException)
            {
                // The same question was answered by a parallel request first; report what was saved
                var current = await _quizRepository.GetByIdWithQuestionsUntracked(quizId);
                return current == null ? null : QuizMapper.ToDto(current);
            }

            return QuizMapper.ToDto(quiz);
        }

        public async Task<QuizDto?> GetQuiz(int userId, int quizId)
        {
            var quiz = await _quizRepository.GetByIdWithQuestions(quizId);
            if (quiz == null || quiz.UserId != userId) return null;

            return QuizMapper.ToDto(quiz);
        }

        public async Task<IEnumerable<QuizDto>> GetUserQuizzes(int userId)
        {
            var quizzes = await _quizRepository.GetByUserId(userId);
            return quizzes.Select(QuizMapper.ToDto);
        }

        private static QuizQuestion ParseQuizQuestion(string jsonResponse)
        {
            try
            {
                var jsonDoc = JsonSerializer.Deserialize<JsonElement>(jsonResponse);

                return new QuizQuestion
                {
                    Question = jsonDoc.GetProperty("question").GetString() ?? string.Empty,
                    IncorrectSentence = jsonDoc.GetProperty("incorrectSentence").GetString() ?? string.Empty,
                    CorrectAnswer = (jsonDoc.GetProperty("correctAnswer").GetString() ?? string.Empty).Trim().ToLowerInvariant(),
                    Explanation = jsonDoc.GetProperty("explanation").GetString() ?? string.Empty
                };
            }
            catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException)
            {
                throw new AIServiceException("The AI returned an unexpected quiz question. Please try again.", ex);
            }
        }
    }

    public static class QuizMapper
    {
        public static QuizDto ToDto(Quiz quiz)
        {
            return new QuizDto
            {
                Id = quiz.Id,
                Title = quiz.Title,
                Score = quiz.Score,
                TotalQuestions = quiz.TotalQuestions,
                IsCompleted = quiz.IsCompleted,
                CreatedAt = quiz.CreatedAt,
                CompletedAt = quiz.CompletedAt,
                Topic = quiz.Topic == null
                    ? null
                    : new TopicDto { Code = quiz.Topic.Code, NameEn = quiz.Topic.NameEn, NameBn = quiz.Topic.NameBn },
                SourceAnalysisId = quiz.SourceAnalysisId,
                Questions = quiz.Questions.OrderBy(q => q.Id).Select(q =>
                {
                    // Only reveal the answer once the question has been answered
                    var isAnswered = !string.IsNullOrEmpty(q.UserAnswer);
                    return new QuizQuestionDto
                    {
                        Id = q.Id,
                        Question = q.Question,
                        IncorrectSentence = q.IncorrectSentence,
                        CorrectAnswer = isAnswered ? q.CorrectAnswer : null,
                        UserAnswer = isAnswered ? q.UserAnswer : null,
                        IsAnsweredCorrectly = isAnswered ? q.IsAnsweredCorrectly : null,
                        Explanation = isAnswered ? q.Explanation : null,
                        AnswerType = q.AcceptedAnswersJson == null ? QuizAnswerTypes.Articles : QuizAnswerTypes.Text,
                        ExplanationBn = isAnswered ? q.ExplanationBn : null,
                        FeedbackEn = isAnswered ? q.FeedbackEn : null,
                        FeedbackBn = isAnswered ? q.FeedbackBn : null
                    };
                }).ToList()
            };
        }
    }
}

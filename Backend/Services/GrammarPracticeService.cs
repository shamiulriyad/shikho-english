using System.Text.Json;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IGrammarPracticeService
    {
        Task<PracticeResponseDto> CorrectSentence(int userId, PracticeRequestDto request);
        Task<IEnumerable<PracticeResponseDto>> GetUserPractices(int userId);
        Task<UserProgressDto> GetUserProgress(int userId);
    }

    public class GrammarPracticeService : IGrammarPracticeService
    {
        private readonly IGrammarPracticeRepository _practiceRepository;
        private readonly IQuizRepository _quizRepository;
        private readonly IOpenAIService _openAIService;

        public GrammarPracticeService(
            IGrammarPracticeRepository practiceRepository,
            IQuizRepository quizRepository,
            IOpenAIService openAIService)
        {
            _practiceRepository = practiceRepository;
            _quizRepository = quizRepository;
            _openAIService = openAIService;
        }

        public async Task<PracticeResponseDto> CorrectSentence(int userId, PracticeRequestDto request)
        {
            var (correctedSentence, mistakes, explanation) = await _openAIService.CorrectSentence(request.Sentence);

            var practice = new GrammarPractice
            {
                UserId = userId,
                OriginalSentence = request.Sentence,
                CorrectedSentence = correctedSentence,
                Mistakes = JsonSerializer.Serialize(mistakes),
                Explanation = explanation,
                IsCorrect = mistakes.Count == 0
            };

            await _practiceRepository.Add(practice);
            await _practiceRepository.SaveChanges();

            return MapToDto(practice, mistakes);
        }

        public async Task<IEnumerable<PracticeResponseDto>> GetUserPractices(int userId)
        {
            var practices = await _practiceRepository.GetByUserId(userId);
            return practices.Select(p => MapToDto(p, DeserializeMistakes(p.Mistakes)));
        }

        public async Task<UserProgressDto> GetUserProgress(int userId)
        {
            var totalCount = await _practiceRepository.GetCountByUserId(userId);
            var correctCount = await _practiceRepository.GetCorrectCountByUserId(userId);
            var correctPercentage = totalCount > 0 ? (correctCount / (double)totalCount) * 100 : 0;

            return new UserProgressDto
            {
                TotalPractices = totalCount,
                CorrectPractices = correctCount,
                CorrectPercentage = correctPercentage,
                TotalQuizzes = await _quizRepository.GetCompletedCountByUserId(userId),
                AverageQuizScore = await _quizRepository.GetAverageScoreByUserId(userId),
                CorrectArticleCount = correctCount,
                TotalArticleCount = totalCount
            };
        }

        private static PracticeResponseDto MapToDto(GrammarPractice practice, List<MistakeDto> mistakes)
        {
            return new PracticeResponseDto
            {
                Id = practice.Id,
                OriginalSentence = practice.OriginalSentence,
                CorrectedSentence = practice.CorrectedSentence,
                Mistakes = mistakes,
                Explanation = practice.Explanation,
                IsCorrect = practice.IsCorrect,
                CreatedAt = practice.CreatedAt
            };
        }

        private static List<MistakeDto> DeserializeMistakes(string mistakesJson)
        {
            try
            {
                return JsonSerializer.Deserialize<List<MistakeDto>>(mistakesJson) ?? new List<MistakeDto>();
            }
            catch (JsonException)
            {
                return new List<MistakeDto>();
            }
        }
    }
}

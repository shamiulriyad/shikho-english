using System.Text.Json;
using Backend.Ai;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IQuestionAnalysisService
    {
        Task<IEnumerable<TopicDto>> GetTopics();
        Task<bool> TopicExists(string code);
        Task<QuestionAnalysisDto> Analyze(int userId, AnalyzeQuestionRequestDto request);
        Task<PagedResultDto<QuestionAnalysisSummaryDto>> GetHistory(int userId, int page, int pageSize, string? topicCode);
        Task<QuestionAnalysisDto?> GetById(int userId, int id);
    }

    public class QuestionAnalysisService : IQuestionAnalysisService
    {
        private const double Temperature = 0.2;

        private readonly IGrammarTopicRepository _topics;
        private readonly IQuestionAnalysisRepository _analyses;
        private readonly IAiProvider _ai;
        private readonly ILogger<QuestionAnalysisService> _logger;

        public QuestionAnalysisService(
            IGrammarTopicRepository topics,
            IQuestionAnalysisRepository analyses,
            IAiProvider ai,
            ILogger<QuestionAnalysisService> logger)
        {
            _topics = topics;
            _analyses = analyses;
            _ai = ai;
            _logger = logger;
        }

        public async Task<IEnumerable<TopicDto>> GetTopics()
        {
            return (await _topics.GetAllOrdered()).Select(MapTopic);
        }

        public async Task<bool> TopicExists(string code)
        {
            return await _topics.GetByCode(code) != null;
        }

        public async Task<QuestionAnalysisDto> Analyze(int userId, AnalyzeQuestionRequestDto request)
        {
            var topics = (await _topics.GetAllOrdered()).ToList();
            var topicsByCode = topics.ToDictionary(t => t.Code);
            var givenTopic = string.IsNullOrWhiteSpace(request.TopicCode) ? null : topicsByCode[request.TopicCode];
            var questionText = request.QuestionText.Trim();
            var studentAnswer = string.IsNullOrWhiteSpace(request.StudentAnswer) ? null : request.StudentAnswer.Trim();

            var topicCodes = topicsByCode.Keys.ToHashSet();
            var result = await ValidatedAiCall.Run(
                _ai, _logger, "analysis",
                QuestionAnalysisPrompt.SystemInstruction,
                QuestionAnalysisPrompt.Build(questionText, givenTopic, studentAnswer, topicCodes),
                Temperature,
                reply => QuestionAnalysisPrompt.Parse(reply, studentAnswer != null, topicCodes),
                QuestionAnalysisPrompt.BuildRetry);

            // The student's own topic choice wins over the AI's guess
            var topic = givenTopic ?? topicsByCode[result.TopicCode];

            var analysis = new QuestionAnalysis
            {
                UserId = userId,
                TopicId = topic.Id,
                QuestionText = questionText,
                StudentAnswer = studentAnswer,
                CorrectAnswer = result.CorrectAnswer,
                StepsJson = JsonSerializer.Serialize(result.Steps),
                RuleEn = result.Rule.En,
                RuleBn = result.Rule.Bn,
                CommonMistakesJson = JsonSerializer.Serialize(result.CommonMistakes),
                StudentAnswerIsCorrect = result.StudentAnswerIsCorrect,
                StudentAnswerFeedbackEn = result.StudentAnswerFeedback?.En,
                StudentAnswerFeedbackBn = result.StudentAnswerFeedback?.Bn,
                AiProvider = _ai.Name,
                AiModel = _ai.Model,
                PromptVersion = QuestionAnalysisPrompt.Version,
                Topic = topic
            };

            await _analyses.Add(analysis);
            await _analyses.SaveChanges();

            return MapToDto(analysis);
        }

        public async Task<PagedResultDto<QuestionAnalysisSummaryDto>> GetHistory(int userId, int page, int pageSize, string? topicCode)
        {
            int? topicId = null;
            if (!string.IsNullOrWhiteSpace(topicCode))
            {
                topicId = (await _topics.GetByCode(topicCode))?.Id ?? -1; // unknown topic: empty page
            }

            var (items, totalCount) = await _analyses.GetPageForUser(userId, page, pageSize, topicId);

            return new PagedResultDto<QuestionAnalysisSummaryDto>
            {
                Items = items.Select(qa => new QuestionAnalysisSummaryDto
                {
                    Id = qa.Id,
                    Topic = MapTopic(qa.Topic!),
                    QuestionText = qa.QuestionText,
                    CorrectAnswer = qa.CorrectAnswer,
                    StudentAnswerIsCorrect = qa.StudentAnswerIsCorrect,
                    CreatedAt = qa.CreatedAt
                }).ToList(),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<QuestionAnalysisDto?> GetById(int userId, int id)
        {
            var analysis = await _analyses.GetByIdForUser(id, userId);
            return analysis == null ? null : MapToDto(analysis);
        }

        private static TopicDto MapTopic(GrammarTopic topic) => new()
        {
            Code = topic.Code,
            NameEn = topic.NameEn,
            NameBn = topic.NameBn
        };

        private static QuestionAnalysisDto MapToDto(QuestionAnalysis analysis) => new()
        {
            Id = analysis.Id,
            Topic = MapTopic(analysis.Topic!),
            QuestionText = analysis.QuestionText,
            CorrectAnswer = analysis.CorrectAnswer,
            Steps = MapTexts(analysis.StepsJson),
            Rule = new BilingualTextDto { En = analysis.RuleEn, Bn = analysis.RuleBn },
            CommonMistakes = MapTexts(analysis.CommonMistakesJson),
            StudentAnswer = analysis.StudentAnswer == null || analysis.StudentAnswerIsCorrect == null
                ? null
                : new StudentAnswerFeedbackDto
                {
                    Answer = analysis.StudentAnswer,
                    IsCorrect = analysis.StudentAnswerIsCorrect.Value,
                    En = analysis.StudentAnswerFeedbackEn ?? string.Empty,
                    Bn = analysis.StudentAnswerFeedbackBn ?? string.Empty
                },
            CreatedAt = analysis.CreatedAt
        };

        private static List<BilingualTextDto> MapTexts(string json) =>
            (JsonSerializer.Deserialize<List<BilingualText>>(json) ?? new List<BilingualText>())
                .Select(t => new BilingualTextDto { En = t.En, Bn = t.Bn })
                .ToList();
    }
}

using Backend.DTOs;
using Backend.Repositories;

namespace Backend.Services
{
    public interface ITopicProgressService
    {
        /// <summary>Progress for every grammar topic, including topics the student has not tried yet.</summary>
        Task<List<TopicProgressDto>> GetTopicProgress(int userId);
    }

    public class TopicProgressService : ITopicProgressService
    {
        // A topic is flagged once there is enough evidence: at least this many marked answers...
        public const int MinAnswersForFlag = 3;
        // ...with accuracy below this percentage
        public const double NeedsPracticeBelowPercent = 60;

        private readonly IGrammarTopicRepository _topics;
        private readonly IQuestionAnalysisRepository _analyses;
        private readonly IQuizRepository _quizzes;

        public TopicProgressService(IGrammarTopicRepository topics, IQuestionAnalysisRepository analyses, IQuizRepository quizzes)
        {
            _topics = topics;
            _analyses = analyses;
            _quizzes = quizzes;
        }

        public async Task<List<TopicProgressDto>> GetTopicProgress(int userId)
        {
            var topics = await _topics.GetAllOrdered();
            var analysed = (await _analyses.GetTopicActivity(userId)).ToDictionary(a => a.TopicId);
            var practised = (await _quizzes.GetPracticeTopicActivity(userId)).ToDictionary(a => a.TopicId);

            return topics.Select(topic =>
            {
                analysed.TryGetValue(topic.Id, out var analysis);
                practised.TryGetValue(topic.Id, out var practice);

                var marked = (analysis?.Checked ?? 0) + (practice?.Checked ?? 0);
                var correct = (analysis?.Correct ?? 0) + (practice?.Correct ?? 0);
                double? accuracy = marked == 0 ? null : Math.Round(correct * 100.0 / marked, 1);

                var lastActivity = new[] { analysis?.LastActivityAt, practice?.LastActivityAt }.Max();

                return new TopicProgressDto
                {
                    Topic = new TopicDto { Code = topic.Code, NameEn = topic.NameEn, NameBn = topic.NameBn },
                    QuestionsAnalysed = analysis?.Count ?? 0,
                    PracticeAnswered = practice?.Count ?? 0,
                    AnswersMarked = marked,
                    AnswersCorrect = correct,
                    AccuracyPercentage = accuracy,
                    NeedsPractice = marked >= MinAnswersForFlag && accuracy < NeedsPracticeBelowPercent,
                    LastActivityAt = lastActivity
                };
            }).ToList();
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Per-topic counts for one student. Checked/Correct count answers the AI marked.</summary>
    public record TopicActivity(int TopicId, int Count, int Checked, int Correct, DateTime LastActivityAt);

    public interface IGrammarTopicRepository : IBaseRepository<GrammarTopic>
    {
        Task<IEnumerable<GrammarTopic>> GetAllOrdered();
        Task<GrammarTopic?> GetByCode(string code);
    }

    public interface IQuestionAnalysisRepository : IBaseRepository<QuestionAnalysis>
    {
        Task<QuestionAnalysis?> GetByIdForUser(int id, int userId);
        Task<(List<QuestionAnalysis> Items, int TotalCount)> GetPageForUser(int userId, int page, int pageSize, int? topicId);
        Task<List<TopicActivity>> GetTopicActivity(int userId);
    }

    public class GrammarTopicRepository : BaseRepository<GrammarTopic>, IGrammarTopicRepository
    {
        public GrammarTopicRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GrammarTopic>> GetAllOrdered()
        {
            return await _dbSet.OrderBy(t => t.SortOrder).ToListAsync();
        }

        public async Task<GrammarTopic?> GetByCode(string code)
        {
            return await _dbSet.FirstOrDefaultAsync(t => t.Code == code);
        }
    }

    public class QuestionAnalysisRepository : BaseRepository<QuestionAnalysis>, IQuestionAnalysisRepository
    {
        public QuestionAnalysisRepository(AppDbContext context) : base(context) { }

        // Filtering by user in the query keeps other students' history unreachable
        public async Task<QuestionAnalysis?> GetByIdForUser(int id, int userId)
        {
            return await _dbSet
                .Include(qa => qa.Topic)
                .FirstOrDefaultAsync(qa => qa.Id == id && qa.UserId == userId);
        }

        public async Task<(List<QuestionAnalysis> Items, int TotalCount)> GetPageForUser(int userId, int page, int pageSize, int? topicId)
        {
            var query = _dbSet.Where(qa => qa.UserId == userId);
            if (topicId != null)
            {
                query = query.Where(qa => qa.TopicId == topicId);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Include(qa => qa.Topic)
                .OrderByDescending(qa => qa.CreatedAt)
                .ThenByDescending(qa => qa.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<TopicActivity>> GetTopicActivity(int userId)
        {
            return await _dbSet
                .Where(qa => qa.UserId == userId)
                .GroupBy(qa => qa.TopicId)
                .Select(g => new TopicActivity(
                    g.Key,
                    g.Count(),
                    g.Count(qa => qa.StudentAnswerIsCorrect != null),
                    g.Count(qa => qa.StudentAnswerIsCorrect == true),
                    g.Max(qa => qa.CreatedAt)))
                .ToListAsync();
        }
    }
}

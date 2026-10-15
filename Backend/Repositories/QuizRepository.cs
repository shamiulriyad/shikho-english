using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Repositories
{
    public class QuizRepository : BaseRepository<Quiz>, IQuizRepository
    {
        public QuizRepository(AppDbContext context) : base(context) { }

        public async Task<Quiz?> GetByIdWithQuestions(int id)
        {
            return await _dbSet
                .Include(q => q.Topic)
                .Include(q => q.Questions.OrderBy(qq => qq.Id))
                .FirstOrDefaultAsync(q => q.Id == id);
        }

        // Reads the saved state, ignoring entities this context already changed
        public async Task<Quiz?> GetByIdWithQuestionsUntracked(int id)
        {
            return await _dbSet
                .AsNoTracking()
                .Include(q => q.Topic)
                .Include(q => q.Questions.OrderBy(qq => qq.Id))
                .FirstOrDefaultAsync(q => q.Id == id);
        }

        public async Task<IEnumerable<Quiz>> GetByUserId(int userId)
        {
            return await _dbSet
                .Where(q => q.UserId == userId)
                .Include(q => q.Topic)
                .Include(q => q.Questions.OrderBy(qq => qq.Id))
                .OrderByDescending(q => q.CreatedAt)
                .ToListAsync();
        }

        // Answered practice-set questions per topic (article quizzes have no topic and are not included)
        public async Task<List<TopicActivity>> GetPracticeTopicActivity(int userId)
        {
            return await _context.QuizQuestions
                .Where(qq => qq.Quiz!.UserId == userId && qq.Quiz.TopicId != null && qq.UserAnswer != "")
                .GroupBy(qq => qq.Quiz!.TopicId!.Value)
                .Select(g => new TopicActivity(
                    g.Key,
                    g.Count(),
                    g.Count(),
                    g.Count(qq => qq.IsAnsweredCorrectly),
                    g.Max(qq => qq.Quiz!.CompletedAt ?? qq.Quiz.CreatedAt)))
                .ToListAsync();
        }

        public async Task<int> GetCompletedCountByUserId(int userId)
        {
            return await _dbSet.CountAsync(q => q.UserId == userId && q.IsCompleted);
        }

        public async Task<double> GetAverageScoreByUserId(int userId)
        {
            var quizzes = await _dbSet
                .Where(q => q.UserId == userId && q.IsCompleted && q.TotalQuestions > 0)
                .ToListAsync();

            if (quizzes.Count == 0) return 0;
            return quizzes.Average(q => (double)q.Score / q.TotalQuestions * 100);
        }
    }
}

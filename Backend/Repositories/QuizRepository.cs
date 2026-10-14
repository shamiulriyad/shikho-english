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
                .Include(q => q.Questions.OrderBy(qq => qq.Id))
                .FirstOrDefaultAsync(q => q.Id == id);
        }

        public async Task<IEnumerable<Quiz>> GetByUserId(int userId)
        {
            return await _dbSet
                .Where(q => q.UserId == userId)
                .Include(q => q.Questions.OrderBy(qq => qq.Id))
                .OrderByDescending(q => q.CreatedAt)
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

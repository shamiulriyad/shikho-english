using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Repositories
{
    public class GrammarPracticeRepository : BaseRepository<GrammarPractice>, IGrammarPracticeRepository
    {
        public GrammarPracticeRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GrammarPractice>> GetByUserId(int userId)
        {
            return await _dbSet.Where(gp => gp.UserId == userId).OrderByDescending(gp => gp.CreatedAt).ToListAsync();
        }

        public async Task<int> GetCountByUserId(int userId)
        {
            return await _dbSet.CountAsync(gp => gp.UserId == userId);
        }

        public async Task<int> GetCorrectCountByUserId(int userId)
        {
            return await _dbSet.CountAsync(gp => gp.UserId == userId && gp.IsCorrect);
        }
    }
}

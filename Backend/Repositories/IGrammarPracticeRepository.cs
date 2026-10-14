using Backend.Models;

namespace Backend.Repositories
{
    public interface IGrammarPracticeRepository : IBaseRepository<GrammarPractice>
    {
        Task<IEnumerable<GrammarPractice>> GetByUserId(int userId);
        Task<int> GetCountByUserId(int userId);
        Task<int> GetCorrectCountByUserId(int userId);
    }
}

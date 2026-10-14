using Backend.Models;

namespace Backend.Repositories
{
    public interface IQuizRepository : IBaseRepository<Quiz>
    {
        Task<Quiz?> GetByIdWithQuestions(int id);
        Task<IEnumerable<Quiz>> GetByUserId(int userId);
        Task<int> GetCompletedCountByUserId(int userId);
        Task<double> GetAverageScoreByUserId(int userId);
    }
}

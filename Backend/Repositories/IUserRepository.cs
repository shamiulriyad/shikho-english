using Backend.Models;

namespace Backend.Repositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<User?> GetByEmail(string email);
        Task<User?> GetByUsername(string username);
    }
}

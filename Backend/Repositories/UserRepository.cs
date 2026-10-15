using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;

namespace Backend.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        // Matches the unique index on lower(btrim("Email")) so the lookup is case-insensitive and indexed
        public async Task<User?> GetByEmail(string email)
        {
            var normalizedEmail = EmailNormalization.Normalize(email);
            return await _dbSet.FirstOrDefaultAsync(u => u.Email.Trim().ToLower() == normalizedEmail);
        }

        public async Task<User?> GetByUsername(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Username == username);
        }
    }
}

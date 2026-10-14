using System;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Repositories
{
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public BaseRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<T?> GetById(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        public async Task<IEnumerable<T>> GetAll()
        {
            return await _dbSet.ToListAsync();
        }

        public async Task<IEnumerable<T>> Find(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        public async Task<bool> Add(T entity)
        {
            await _dbSet.AddAsync(entity);
            return true;
        }

        public async Task<bool> Update(T entity)
        {
            _dbSet.Update(entity);
            return await Task.FromResult(true);
        }

        public async Task<bool> Delete(int id)
        {
            var entity = await GetById(id);
            if (entity == null) return false;

            _dbSet.Remove(entity);
            return true;
        }

        public async Task<bool> SaveChanges()
        {
            try
            {
                var result = await _context.SaveChangesAsync();
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}

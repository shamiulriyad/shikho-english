using System.Linq.Expressions;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Tests.Fakes;

/// <summary>
/// Minimal in-memory repositories for service unit tests. SaveChanges assigns ids the way the database would.
/// </summary>
public abstract class InMemoryRepository<T> : IBaseRepository<T> where T : class
{
    protected readonly List<T> Items = new();
    private readonly List<T> _pending = new();

    public Exception? SaveException { get; set; }
    public int SaveCalls { get; private set; }

    public Task<T?> GetById(int id) => Task.FromResult(Items.FirstOrDefault(i => GetId(i) == id));
    public Task<IEnumerable<T>> GetAll() => Task.FromResult<IEnumerable<T>>(Items.ToList());
    public Task<IEnumerable<T>> Find(Expression<Func<T, bool>> predicate) =>
        Task.FromResult<IEnumerable<T>>(Items.Where(predicate.Compile()).ToList());

    public Task<bool> Add(T entity)
    {
        _pending.Add(entity);
        return Task.FromResult(true);
    }

    public Task<bool> Update(T entity) => Task.FromResult(true);

    public Task<bool> Delete(int id) => Task.FromResult(Items.RemoveAll(i => GetId(i) == id) > 0);

    public Task<bool> SaveChanges()
    {
        SaveCalls++;
        if (SaveException != null) throw SaveException;

        foreach (var entity in _pending)
        {
            AssignIds(entity, Items.Count + 1);
            Items.Add(entity);
        }
        _pending.Clear();
        return Task.FromResult(true);
    }

    protected abstract int GetId(T entity);
    protected abstract void AssignIds(T entity, int nextId);
}

public class InMemoryQuizRepository : InMemoryRepository<Quiz>, IQuizRepository
{
    private int _nextQuestionId = 1;

    public Task<Quiz?> GetByIdWithQuestions(int id) => GetById(id);

    public Task<Quiz?> GetByIdWithQuestionsUntracked(int id) => GetById(id);

    public Task<List<TopicActivity>> GetPracticeTopicActivity(int userId) => Task.FromResult(new List<TopicActivity>());

    public Task<IEnumerable<Quiz>> GetByUserId(int userId) =>
        Task.FromResult<IEnumerable<Quiz>>(Items.Where(q => q.UserId == userId).OrderByDescending(q => q.CreatedAt).ToList());

    public Task<int> GetCompletedCountByUserId(int userId) =>
        Task.FromResult(Items.Count(q => q.UserId == userId && q.IsCompleted));

    public Task<double> GetAverageScoreByUserId(int userId)
    {
        var completed = Items.Where(q => q.UserId == userId && q.IsCompleted && q.TotalQuestions > 0).ToList();
        return Task.FromResult(completed.Count == 0 ? 0 : completed.Average(q => (double)q.Score / q.TotalQuestions * 100));
    }

    protected override int GetId(Quiz entity) => entity.Id;

    protected override void AssignIds(Quiz entity, int nextId)
    {
        entity.Id = nextId;
        foreach (var question in entity.Questions)
        {
            question.Id = _nextQuestionId++;
            question.QuizId = entity.Id;
        }
    }
}

public class InMemoryGrammarPracticeRepository : InMemoryRepository<GrammarPractice>, IGrammarPracticeRepository
{
    public Task<IEnumerable<GrammarPractice>> GetByUserId(int userId) =>
        Task.FromResult<IEnumerable<GrammarPractice>>(Items.Where(p => p.UserId == userId).OrderByDescending(p => p.CreatedAt).ToList());

    public Task<int> GetCountByUserId(int userId) => Task.FromResult(Items.Count(p => p.UserId == userId));

    public Task<int> GetCorrectCountByUserId(int userId) => Task.FromResult(Items.Count(p => p.UserId == userId && p.IsCorrect));

    protected override int GetId(GrammarPractice entity) => entity.Id;

    protected override void AssignIds(GrammarPractice entity, int nextId) => entity.Id = nextId;
}

public class InMemoryUserRepository : InMemoryRepository<User>, IUserRepository
{
    public IReadOnlyList<User> Saved => Items;

    public Task<User?> GetByEmail(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return Task.FromResult(Items.FirstOrDefault(u => u.Email.Trim().ToLowerInvariant() == normalized));
    }

    public Task<User?> GetByUsername(string username) =>
        Task.FromResult(Items.FirstOrDefault(u => u.Username == username));

    protected override int GetId(User entity) => entity.Id;

    protected override void AssignIds(User entity, int nextId) => entity.Id = nextId;
}

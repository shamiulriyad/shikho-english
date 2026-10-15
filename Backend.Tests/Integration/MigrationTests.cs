using Backend.DTOs;
using Backend.Migrations;
using Backend.Services;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace Backend.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class MigrationTests
{
    private const string InitialCreate = "20261014213044_InitialCreate";
    private const string CaseInsensitiveUniqueEmailId = "20261015151439_CaseInsensitiveUniqueEmail";
    private const string AddQuestionAnalysisId = "20261015181633_AddQuestionAnalysis";
    private const string AddPracticeSetsId = "20261015184734_AddPracticeSets";

    private readonly PostgresFixture _postgres;

    public MigrationTests(PostgresFixture postgres)
    {
        _postgres = postgres;
    }

    [Fact]
    public async Task AllMigrations_ApplyToAnEmptyDatabase()
    {
        await using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());

        await db.Database.MigrateAsync();

        Assert.Equal(new[] { InitialCreate, CaseInsensitiveUniqueEmailId, AddQuestionAnalysisId, AddPracticeSetsId }, await db.Database.GetAppliedMigrationsAsync());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        Assert.Contains("lower(btrim", await GetIndexDefinitionAsync(db));
        Assert.Equal(GrammarTopicSeed.All.Select(t => t.Code), await db.GrammarTopics.OrderBy(t => t.SortOrder).Select(t => t.Code).ToListAsync());
    }

    [Fact]
    public async Task QuestionAnalysisMigration_KeepsExistingData()
    {
        await using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());
        await db.GetService<IMigrator>().MigrateAsync(CaseInsensitiveUniqueEmailId);
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Email", "Username", "PasswordHash", "FullName", "CreatedAt", "UpdatedAt", "IsActive")
            VALUES ('existing@example.com', 'existing', 'h', 'Existing', now(), now(), true);
            INSERT INTO "GrammarPractices" ("UserId", "OriginalSentence", "CorrectedSentence", "Mistakes", "Explanation", "IsCorrect", "CreatedAt")
            SELECT "Id", 'a apple', 'an apple', '[]', 'x', false, now() FROM "Users";
            """);

        await db.Database.MigrateAsync();

        Assert.Equal(1, await db.Users.CountAsync());
        Assert.Equal("a apple", (await db.GrammarPractices.SingleAsync()).OriginalSentence);
        Assert.Equal(GrammarTopicSeed.All.Length, await db.GrammarTopics.CountAsync());
    }

    [Fact]
    public async Task EmailIndexMigration_WithCaseDuplicates_AbortsWithoutChangingData()
    {
        await using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());
        await db.GetService<IMigrator>().MigrateAsync(InitialCreate);
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Email", "Username", "PasswordHash", "FullName", "CreatedAt", "UpdatedAt", "IsActive")
            VALUES ('Dup@Example.com', 'one', 'h', 'One', now(), now(), true),
                   ('dup@example.com ', 'two', 'h', 'Two', now(), now(), true),
                   ('unique@example.com', 'three', 'h', 'Three', now(), now(), true);
            """);

        var error = await Record.ExceptionAsync(() => db.Database.MigrateAsync());

        var postgres = Assert.IsType<PostgresException>(error);
        Assert.Contains("dup@example.com (2 accounts)", postgres.MessageText);
        Assert.Equal(new[] { InitialCreate }, await db.Database.GetAppliedMigrationsAsync());
        Assert.Null(await GetIndexDefinitionAsync(db));
        var emails = await db.Users.AsNoTracking().OrderBy(u => u.Username).Select(u => u.Email).ToListAsync();
        Assert.Equal(new[] { "Dup@Example.com", "unique@example.com", "dup@example.com " }, emails);
    }

    [Fact]
    public async Task EmailIndexMigration_AfterManualResolution_Succeeds()
    {
        await using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());
        await db.GetService<IMigrator>().MigrateAsync(InitialCreate);
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Email", "Username", "PasswordHash", "FullName", "CreatedAt", "UpdatedAt", "IsActive")
            VALUES ('Mixed.Case@Example.com', 'one', 'h', 'One', now(), now(), true);
            """);

        await db.Database.MigrateAsync();

        // Existing rows keep their original casing; lookups still find them
        var repository = new UserRepository(db);
        var user = await repository.GetByEmail("mixed.case@example.com");
        Assert.Equal("Mixed.Case@Example.com", user!.Email);
    }

    [Fact]
    public async Task PracticeSetsMigration_KeepsExistingQuizzesAsArticleQuizzes()
    {
        await using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());
        await db.GetService<IMigrator>().MigrateAsync(AddQuestionAnalysisId);
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Email", "Username", "PasswordHash", "FullName", "CreatedAt", "UpdatedAt", "IsActive")
            VALUES ('quiz@example.com', 'quizzer', 'h', 'Quizzer', now(), now(), true);
            INSERT INTO "Quizzes" ("UserId", "Title", "Score", "TotalQuestions", "CreatedAt", "IsCompleted")
            SELECT "Id", 'Old quiz', 1, 1, now(), true FROM "Users";
            INSERT INTO "QuizQuestions" ("QuizId", "Question", "IncorrectSentence", "CorrectAnswer", "UserAnswer", "IsAnsweredCorrectly", "Explanation")
            SELECT "Id", 'Choose', '___ apple', 'an', 'an', true, 'Vowel sound.' FROM "Quizzes";
            """);

        await db.Database.MigrateAsync();

        var quiz = await db.Quizzes.Include(q => q.Questions).SingleAsync();
        Assert.Null(quiz.TopicId);
        Assert.Null(quiz.SourceAnalysisId);
        var question = Assert.Single(quiz.Questions);
        Assert.Null(question.AcceptedAnswersJson);
        Assert.Equal("an", question.UserAnswer);
        Assert.Equal(QuizAnswerTypes.Articles, QuizMapper.ToDto(quiz).Questions[0].AnswerType);
    }

    [Fact]
    public void EmailLookup_UsesTheIndexedExpression()
    {
        using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());

        var sql = db.Users.Where(u => u.Email.Trim().ToLower() == "x").ToQueryString();

        Assert.Contains("lower(btrim(u.\"Email\"", sql);
    }

    [Fact]
    public async Task Repository_SaveChanges_PropagatesDatabaseErrors()
    {
        await using var db = PostgresFixture.CreateContext(_postgres.NewDatabaseConnectionString());
        await db.Database.MigrateAsync();
        var repository = new GrammarPracticeRepository(db);

        await repository.Add(new GrammarPractice { UserId = 12345, OriginalSentence = "orphan" });

        await Assert.ThrowsAsync<DbUpdateException>(() => repository.SaveChanges());
    }

    private static async Task<string?> GetIndexDefinitionAsync(DbContext db) =>
        await db.Database.SqlQuery<string>(
                $"SELECT indexdef AS \"Value\" FROM pg_indexes WHERE indexname = {CaseInsensitiveUniqueEmail.IndexName}")
            .SingleOrDefaultAsync();
}

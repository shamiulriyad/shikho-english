using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<GrammarPractice> GrammarPractices { get; set; } = null!;
        public DbSet<Quiz> Quizzes { get; set; } = null!;
        public DbSet<QuizQuestion> QuizQuestions { get; set; } = null!;
        public DbSet<UserProgress> UserProgresses { get; set; } = null!;
        public DbSet<GrammarTopic> GrammarTopics { get; set; } = null!;
        public DbSet<QuestionAnalysis> QuestionAnalyses { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // GrammarPractice configuration
            modelBuilder.Entity<GrammarPractice>()
                .HasKey(gp => gp.Id);
            modelBuilder.Entity<GrammarPractice>()
                .HasOne(gp => gp.User)
                .WithMany(u => u.GrammarPractices)
                .HasForeignKey(gp => gp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Quiz configuration
            modelBuilder.Entity<Quiz>()
                .HasKey(q => q.Id);
            modelBuilder.Entity<Quiz>()
                .HasOne(q => q.User)
                .WithMany(u => u.Quizzes)
                .HasForeignKey(q => q.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Quiz>()
                .HasOne(q => q.Topic)
                .WithMany()
                .HasForeignKey(q => q.TopicId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Quiz>()
                .HasOne(q => q.SourceAnalysis)
                .WithMany()
                .HasForeignKey(q => q.SourceAnalysisId)
                .OnDelete(DeleteBehavior.SetNull);

            // QuizQuestion configuration
            modelBuilder.Entity<QuizQuestion>()
                .HasKey(qq => qq.Id);
            modelBuilder.Entity<QuizQuestion>()
                .HasOne(qq => qq.Quiz)
                .WithMany(q => q.Questions)
                .HasForeignKey(qq => qq.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<QuizQuestion>()
                .Property(qq => qq.Version)
                .IsRowVersion();

            // UserProgress configuration
            modelBuilder.Entity<UserProgress>()
                .HasKey(up => up.Id);
            modelBuilder.Entity<UserProgress>()
                .HasOne(up => up.User)
                .WithOne(u => u.UserProgress)
                .HasForeignKey<UserProgress>(up => up.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // GrammarTopic configuration
            modelBuilder.Entity<GrammarTopic>(topic =>
            {
                topic.HasKey(t => t.Id);
                topic.Property(t => t.Code).HasMaxLength(50);
                topic.Property(t => t.NameEn).HasMaxLength(100);
                topic.Property(t => t.NameBn).HasMaxLength(100);
                topic.HasIndex(t => t.Code).IsUnique();
                topic.HasData(GrammarTopicSeed.All);
            });

            // QuestionAnalysis configuration
            modelBuilder.Entity<QuestionAnalysis>(analysis =>
            {
                analysis.HasKey(qa => qa.Id);
                analysis.Property(qa => qa.QuestionText).HasMaxLength(2000);
                analysis.Property(qa => qa.StudentAnswer).HasMaxLength(500);
                analysis.Property(qa => qa.AiProvider).HasMaxLength(20);
                analysis.Property(qa => qa.AiModel).HasMaxLength(100);
                analysis.Property(qa => qa.PromptVersion).HasMaxLength(20);
                analysis.HasIndex(qa => new { qa.UserId, qa.CreatedAt });
                analysis.HasOne(qa => qa.User)
                    .WithMany()
                    .HasForeignKey(qa => qa.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                // Topics are reference data; never delete one that history points to
                analysis.HasOne(qa => qa.Topic)
                    .WithMany()
                    .HasForeignKey(qa => qa.TopicId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}

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

            // QuizQuestion configuration
            modelBuilder.Entity<QuizQuestion>()
                .HasKey(qq => qq.Id);
            modelBuilder.Entity<QuizQuestion>()
                .HasOne(qq => qq.Quiz)
                .WithMany(q => q.Questions)
                .HasForeignKey(qq => qq.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserProgress configuration
            modelBuilder.Entity<UserProgress>()
                .HasKey(up => up.Id);
            modelBuilder.Entity<UserProgress>()
                .HasOne(up => up.User)
                .WithOne(u => u.UserProgress)
                .HasForeignKey<UserProgress>(up => up.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

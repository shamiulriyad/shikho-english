using System;

namespace Backend.Models
{
    public class UserProgress
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TotalPractices { get; set; }
        public int CorrectPractices { get; set; }
        public int TotalQuizzes { get; set; }
        public double AverageQuizScore { get; set; }
        public int CorrectArticleCount { get; set; }
        public int TotalArticleCount { get; set; }
        public DateTime LastPracticeDate { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User? User { get; set; }
    }
}

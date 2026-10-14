using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class Quiz
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public bool IsCompleted { get; set; }

        // Navigation properties
        public User? User { get; set; }
        public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
    }
}

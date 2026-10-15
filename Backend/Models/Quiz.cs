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

        // Set for practice sets generated from a question analysis; null for article quizzes
        public int? TopicId { get; set; }
        public int? SourceAnalysisId { get; set; }

        // Navigation properties
        public User? User { get; set; }
        public GrammarTopic? Topic { get; set; }
        public QuestionAnalysis? SourceAnalysis { get; set; }
        public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
    }
}

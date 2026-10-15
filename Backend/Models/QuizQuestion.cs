using System;

namespace Backend.Models
{
    public class QuizQuestion
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public string Question { get; set; } = string.Empty;
        public string IncorrectSentence { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
        public string UserAnswer { get; set; } = string.Empty;
        public bool IsAnsweredCorrectly { get; set; }
        public string Explanation { get; set; } = string.Empty;

        // Practice-set questions take free-text answers; null means an a/an/the article question
        public string? AcceptedAnswersJson { get; set; } // JSON list of strings
        public string? ExplanationBn { get; set; }
        public string? FeedbackEn { get; set; }
        public string? FeedbackBn { get; set; }

        // Maps to PostgreSQL's xmin, so two answers submitted at the same moment cannot both be scored
        public uint Version { get; set; }

        // Navigation property
        public Quiz? Quiz { get; set; }
    }
}

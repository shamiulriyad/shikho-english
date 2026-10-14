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

        // Navigation property
        public Quiz? Quiz { get; set; }
    }
}

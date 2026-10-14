using System;

namespace Backend.Models
{
    public class GrammarPractice
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string OriginalSentence { get; set; } = string.Empty;
        public string CorrectedSentence { get; set; } = string.Empty;
        public string Mistakes { get; set; } = string.Empty; // JSON
        public string Explanation { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User? User { get; set; }
    }
}

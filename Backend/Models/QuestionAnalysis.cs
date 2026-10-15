using System;

namespace Backend.Models
{
    /// <summary>
    /// A question a student asked the AI teacher to analyse, with the answer explained in English and Bangla.
    /// </summary>
    public class QuestionAnalysis
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TopicId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string? StudentAnswer { get; set; }
        public string CorrectAnswer { get; set; } = string.Empty;
        public string StepsJson { get; set; } = "[]"; // JSON list of BilingualText
        public string RuleEn { get; set; } = string.Empty;
        public string RuleBn { get; set; } = string.Empty;
        public string CommonMistakesJson { get; set; } = "[]"; // JSON list of BilingualText
        public bool? StudentAnswerIsCorrect { get; set; }
        public string? StudentAnswerFeedbackEn { get; set; }
        public string? StudentAnswerFeedbackBn { get; set; }

        // Which model produced this, so answers can be audited when prompts or providers change
        public string AiProvider { get; set; } = string.Empty;
        public string AiModel { get; set; } = string.Empty;
        public string PromptVersion { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User? User { get; set; }
        public GrammarTopic? Topic { get; set; }
    }

    public record BilingualText(string En, string Bn);
}

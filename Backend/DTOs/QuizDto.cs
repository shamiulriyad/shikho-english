using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class QuizAnswerDto
    {
        public int QuestionId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Answer { get; set; } = string.Empty;
    }

    public class QuizDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public List<QuizQuestionDto> Questions { get; set; } = new List<QuizQuestionDto>();

        // Present for practice sets generated from a question analysis
        public TopicDto? Topic { get; set; }
        public int? SourceAnalysisId { get; set; }
    }

    public class CreatePracticeSetRequestDto
    {
        [Range(1, 5)]
        public int Count { get; set; } = 3;
    }

    public class QuizQuestionDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string IncorrectSentence { get; set; } = string.Empty;
        public string? CorrectAnswer { get; set; }
        public string? UserAnswer { get; set; }
        public bool? IsAnsweredCorrectly { get; set; }
        public string? Explanation { get; set; }

        // "articles" (choose a, an or the) or "text" (type the answer)
        public string AnswerType { get; set; } = QuizAnswerTypes.Articles;

        // Only revealed after answering; null for article questions
        public string? ExplanationBn { get; set; }
        public string? FeedbackEn { get; set; }
        public string? FeedbackBn { get; set; }
    }

    public static class QuizAnswerTypes
    {
        public const string Articles = "articles";
        public const string Text = "text";
    }
}

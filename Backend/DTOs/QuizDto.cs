using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class QuizAnswerDto
    {
        public int QuestionId { get; set; }

        [Required]
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
    }
}

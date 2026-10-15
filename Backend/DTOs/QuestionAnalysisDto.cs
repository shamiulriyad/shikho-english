using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class AnalyzeQuestionRequestDto
    {
        [Required]
        [MinLength(3)]
        [MaxLength(2000)]
        public string QuestionText { get; set; } = string.Empty;

        // Optional; the AI detects the topic when it is not given
        [MaxLength(50)]
        public string? TopicCode { get; set; }

        // Optional; when given, the AI also checks it
        [MaxLength(500)]
        public string? StudentAnswer { get; set; }
    }

    public class TopicDto
    {
        public string Code { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string NameBn { get; set; } = string.Empty;
    }

    public class BilingualTextDto
    {
        public string En { get; set; } = string.Empty;
        public string Bn { get; set; } = string.Empty;
    }

    public class StudentAnswerFeedbackDto
    {
        public string Answer { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public string En { get; set; } = string.Empty;
        public string Bn { get; set; } = string.Empty;
    }

    public class QuestionAnalysisDto
    {
        public int Id { get; set; }
        public TopicDto Topic { get; set; } = new();
        public string QuestionText { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
        public List<BilingualTextDto> Steps { get; set; } = new();
        public BilingualTextDto Rule { get; set; } = new();
        public List<BilingualTextDto> CommonMistakes { get; set; } = new();
        public StudentAnswerFeedbackDto? StudentAnswer { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class QuestionAnalysisSummaryDto
    {
        public int Id { get; set; }
        public TopicDto Topic { get; set; } = new();
        public string QuestionText { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
        public bool? StudentAnswerIsCorrect { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
    }
}

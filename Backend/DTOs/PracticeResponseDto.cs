using System;
using System.Collections.Generic;

namespace Backend.DTOs
{
    public class MistakeDto
    {
        public string Type { get; set; } = string.Empty;
        public string Original { get; set; } = string.Empty;
        public string Correction { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }

    public class PracticeResponseDto
    {
        public int Id { get; set; }
        public string OriginalSentence { get; set; } = string.Empty;
        public string CorrectedSentence { get; set; } = string.Empty;
        public List<MistakeDto> Mistakes { get; set; } = new List<MistakeDto>();
        public string Explanation { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

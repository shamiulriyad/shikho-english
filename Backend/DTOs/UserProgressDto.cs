using System;

namespace Backend.DTOs
{
    public class UserProgressDto
    {
        public int TotalPractices { get; set; }
        public int CorrectPractices { get; set; }
        public double CorrectPercentage { get; set; }
        public int TotalQuizzes { get; set; }
        public double AverageQuizScore { get; set; }
        public int CorrectArticleCount { get; set; }
        public int TotalArticleCount { get; set; }
    }

    public class TopicProgressDto
    {
        public TopicDto Topic { get; set; } = new();
        public int QuestionsAnalysed { get; set; }
        public int PracticeAnswered { get; set; }

        // Answers that were marked: student answers given with an analysis plus practice answers
        public int AnswersMarked { get; set; }
        public int AnswersCorrect { get; set; }
        public double? AccuracyPercentage { get; set; }

        public bool NeedsPractice { get; set; }
        public DateTime? LastActivityAt { get; set; }
    }
}

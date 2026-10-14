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
}

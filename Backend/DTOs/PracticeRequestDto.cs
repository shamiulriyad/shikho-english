using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class PracticeRequestDto
    {
        [Required]
        [MaxLength(500)]
        public string Sentence { get; set; } = string.Empty;
    }
}

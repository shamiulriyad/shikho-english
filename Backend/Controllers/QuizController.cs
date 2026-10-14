using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuizController : ControllerBase
    {
        private const int MaxQuestions = 10;

        private readonly IQuizService _quizService;

        public QuizController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        [HttpPost("create")]
        public async Task<ActionResult<QuizDto>> CreateQuiz([FromQuery] int numberOfQuestions = 5)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            if (numberOfQuestions < 1 || numberOfQuestions > MaxQuestions)
                return BadRequest(new { message = $"numberOfQuestions must be between 1 and {MaxQuestions}" });

            try
            {
                var result = await _quizService.CreateQuiz(userId.Value, numberOfQuestions);
                return Ok(result);
            }
            catch (AIServiceException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
            }
        }

        [HttpPost("{quizId}/answer")]
        public async Task<ActionResult<QuizDto>> SubmitAnswer(int quizId, [FromBody] QuizAnswerDto answerDto)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _quizService.SubmitQuizAnswer(userId.Value, quizId, answerDto.QuestionId, answerDto.Answer);
            if (result == null)
                return NotFound(new { message = "Quiz or question not found" });

            return Ok(result);
        }

        [HttpGet("{quizId}")]
        public async Task<ActionResult<QuizDto>> GetQuiz(int quizId)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _quizService.GetQuiz(userId.Value, quizId);
            if (result == null)
                return NotFound(new { message = "Quiz not found" });

            return Ok(result);
        }

        [HttpGet("user/all")]
        public async Task<ActionResult<IEnumerable<QuizDto>>> GetUserQuizzes()
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _quizService.GetUserQuizzes(userId.Value);
            return Ok(result);
        }
    }
}

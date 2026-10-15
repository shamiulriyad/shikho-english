using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Backend.Options;
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
        [EnableRateLimiting(RateLimitPolicies.Ai)]
        public async Task<ActionResult<QuizDto>> CreateQuiz([FromQuery] int numberOfQuestions = 5)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            if (numberOfQuestions < 1 || numberOfQuestions > MaxQuestions)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"numberOfQuestions must be between 1 and {MaxQuestions}");

            var result = await _quizService.CreateQuiz(userId.Value, numberOfQuestions);
            return Ok(result);
        }

        [HttpPost("{quizId}/answer")]
        [EnableRateLimiting(RateLimitPolicies.Ai)]
        public async Task<ActionResult<QuizDto>> SubmitAnswer(int quizId, [FromBody] QuizAnswerDto answerDto)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _quizService.SubmitQuizAnswer(userId.Value, quizId, answerDto.QuestionId, answerDto.Answer);
            if (result == null)
                return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Quiz or question not found");

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
                return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Quiz not found");

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

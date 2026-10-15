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
    public class QuestionsController : ControllerBase
    {
        private const int MaxPageSize = 50;

        private readonly IQuestionAnalysisService _analysisService;
        private readonly IPracticeSetService _practiceSetService;

        public QuestionsController(IQuestionAnalysisService analysisService, IPracticeSetService practiceSetService)
        {
            _analysisService = analysisService;
            _practiceSetService = practiceSetService;
        }

        [HttpPost("analyze")]
        [EnableRateLimiting(RateLimitPolicies.Ai)]
        public async Task<ActionResult<QuestionAnalysisDto>> Analyze([FromBody] AnalyzeQuestionRequestDto request)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            if (!string.IsNullOrWhiteSpace(request.TopicCode) && !await _analysisService.TopicExists(request.TopicCode))
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Unknown topic '{request.TopicCode}'");

            var result = await _analysisService.Analyze(userId.Value, request);
            return Ok(result);
        }

        [HttpGet("history")]
        public async Task<ActionResult<PagedResultDto<QuestionAnalysisSummaryDto>>> GetHistory(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? topic = null)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            if (page < 1 || pageSize < 1 || pageSize > MaxPageSize)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"page must be at least 1 and pageSize between 1 and {MaxPageSize}");

            var result = await _analysisService.GetHistory(userId.Value, page, pageSize, topic);
            return Ok(result);
        }

        [HttpPost("{id}/practice-set")]
        [EnableRateLimiting(RateLimitPolicies.Ai)]
        public async Task<ActionResult<QuizDto>> CreatePracticeSet(int id, [FromBody] CreatePracticeSetRequestDto request)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _practiceSetService.CreateFromAnalysis(userId.Value, id, request.Count);
            if (result == null)
                return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Question not found");

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionAnalysisDto>> GetById(int id)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _analysisService.GetById(userId.Value, id);
            if (result == null)
                return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Question not found");

            return Ok(result);
        }
    }
}

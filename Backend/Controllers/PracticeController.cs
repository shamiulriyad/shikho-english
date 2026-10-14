using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PracticeController : ControllerBase
    {
        private readonly IGrammarPracticeService _practiceService;

        public PracticeController(IGrammarPracticeService practiceService)
        {
            _practiceService = practiceService;
        }

        [HttpPost("submit")]
        public async Task<ActionResult<PracticeResponseDto>> SubmitSentence([FromBody] PracticeRequestDto request)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            try
            {
                var result = await _practiceService.CorrectSentence(userId.Value, request);
                return Ok(result);
            }
            catch (AIServiceException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<PracticeResponseDto>>> GetHistory()
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _practiceService.GetUserPractices(userId.Value);
            return Ok(result);
        }

        [HttpGet("progress")]
        public async Task<ActionResult<UserProgressDto>> GetProgress()
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _practiceService.GetUserProgress(userId.Value);
            return Ok(result);
        }
    }
}

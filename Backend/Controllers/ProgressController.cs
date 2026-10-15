using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProgressController : ControllerBase
    {
        private readonly ITopicProgressService _progressService;

        public ProgressController(ITopicProgressService progressService)
        {
            _progressService = progressService;
        }

        [HttpGet("topics")]
        public async Task<ActionResult<List<TopicProgressDto>>> GetTopicProgress()
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            return Ok(await _progressService.GetTopicProgress(userId.Value));
        }
    }
}

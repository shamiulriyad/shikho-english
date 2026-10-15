using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController : ControllerBase
    {
        private readonly IQuestionAnalysisService _analysisService;

        public TopicsController(IQuestionAnalysisService analysisService)
        {
            _analysisService = analysisService;
        }

        // Reference data only, so it is readable before logging in
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TopicDto>>> GetTopics()
        {
            return Ok(await _analysisService.GetTopics());
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Backend.Options;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] UserRegisterDto registerDto)
        {
            var result = await _authService.Register(registerDto);
            if (!result.Success)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message);

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] UserLoginDto loginDto)
        {
            var result = await _authService.Login(loginDto);
            if (!result.Success)
                return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: result.Message);

            return Ok(result);
        }
    }
}

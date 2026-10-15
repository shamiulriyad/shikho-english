using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;

namespace Backend.Middleware
{
    /// <summary>
    /// Turns unhandled exceptions into ProblemDetails responses without leaking internal details.
    /// </summary>
    public class ApiExceptionHandler : IExceptionHandler
    {
        private readonly IProblemDetailsService _problemDetailsService;
        private readonly ILogger<ApiExceptionHandler> _logger;

        public ApiExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<ApiExceptionHandler> logger)
        {
            _problemDetailsService = problemDetailsService;
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            ProblemDetails problem;
            if (exception is AIServiceException)
            {
                // The AI service already logged the underlying cause
                _logger.LogWarning("AI request failed for {Method} {Path}: {Message}", httpContext.Request.Method, httpContext.Request.Path, exception.Message);
                problem = new ProblemDetails
                {
                    Status = StatusCodes.Status503ServiceUnavailable,
                    Title = "AI service unavailable",
                    Detail = exception.Message
                };
            }
            else
            {
                _logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
                problem = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred",
                    Detail = "Something went wrong on our side. Please try again later."
                };
            }

            httpContext.Response.StatusCode = problem.Status.Value;
            return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problem
            });
        }
    }
}

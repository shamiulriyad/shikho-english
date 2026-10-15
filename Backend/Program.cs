using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Backend.Ai;
using Backend.Data;
using Backend.Middleware;
using Backend.Models;
using Backend.Options;
using Backend.Repositories;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Errors are returned as ProblemDetails; "message" mirrors the detail so existing clients keep working
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["message"] = context.ProblemDetails.Detail ?? context.ProblemDetails.Title;
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    };
});
builder.Services.AddExceptionHandler<ApiExceptionHandler>();

// Configuration is validated at startup so missing or unsafe secrets stop the app instead of failing per request
builder.Services.AddSingleton<IValidateOptions<JwtOptions>, JwtOptionsValidator>();
builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .ValidateOnStart();

builder.Services.AddSingleton<IValidateOptions<AiOptions>, AiOptionsValidator>();
builder.Services.AddOptions<AiOptions>()
    .BindConfiguration(AiOptions.SectionName)
    .ValidateOnStart();

builder.Services.AddSingleton<IValidateOptions<DatabaseOptions>, DatabaseOptionsValidator>();
builder.Services.AddOptions<DatabaseOptions>()
    .BindConfiguration(DatabaseOptions.SectionName)
    .Configure<IConfiguration>((options, configuration) =>
        options.ConnectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty)
    .ValidateOnStart();

builder.Services.AddSingleton<IValidateOptions<RateLimitingOptions>, RateLimitingOptionsValidator>();
builder.Services.AddOptions<RateLimitingOptions>()
    .BindConfiguration(RateLimitingOptions.SectionName)
    .ValidateOnStart();

// Database
builder.Services.AddDbContext<AppDbContext>((services, options) =>
    options.UseNpgsql(services.GetRequiredService<IOptions<DatabaseOptions>>().Value.ConnectionString));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true
        };
    });

// Rate limiting: AI calls per student (cost), login and registration per IP address (password guessing)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();

        await context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
        {
            HttpContext = context.HttpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status429TooManyRequests,
                Title = "Too many requests",
                Detail = "You are going too fast. Please wait a minute and try again."
            }
        });
    };
    options.AddPolicy(RateLimitPolicies.Ai, httpContext =>
    {
        var limits = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
        var student = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var partition = student != null ? $"user:{student}" : $"ip:{httpContext.Connection.RemoteIpAddress}";
        return RateLimitPartition.GetFixedWindowLimiter(partition, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = limits.AiRequestsPerMinute,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
    options.AddPolicy(RateLimitPolicies.Auth, httpContext =>
    {
        var limits = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
        return RateLimitPartition.GetFixedWindowLimiter($"ip:{httpContext.Connection.RemoteIpAddress}", _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = limits.AuthRequestsPerMinute,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
});

builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

// CORS
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(",") ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IGrammarPracticeRepository, GrammarPracticeRepository>();
builder.Services.AddScoped<IQuizRepository, QuizRepository>();
builder.Services.AddScoped<IGrammarTopicRepository, GrammarTopicRepository>();
builder.Services.AddScoped<IQuestionAnalysisRepository, QuestionAnalysisRepository>();

// Services
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IGrammarPracticeService, GrammarPracticeService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IQuestionAnalysisService, QuestionAnalysisService>();
builder.Services.AddScoped<IPracticeSetService, PracticeSetService>();
builder.Services.AddScoped<IAnswerEvaluator, AnswerEvaluator>();
builder.Services.AddScoped<ITopicProgressService, TopicProgressService>();

// AI: Ai:Provider picks the model vendor; feature services only see IAiProvider
builder.Services.AddHttpClient<GeminiProvider>(ConfigureAiHttpClient);
builder.Services.AddHttpClient<OpenAIProvider>(ConfigureAiHttpClient);
builder.Services.AddTransient<IAiProvider>(services =>
    services.GetRequiredService<IOptions<AiOptions>>().Value.IsSelected(AiOptions.OpenAIProvider)
        ? services.GetRequiredService<OpenAIProvider>()
        : services.GetRequiredService<GeminiProvider>());
builder.Services.AddScoped<IGrammarAiService, GrammarAiService>();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
// After authentication so AI limits can be counted per student
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();
// Plain "Healthy"/"Unhealthy" with 200/503 for hosting probes; no details are exposed
app.MapHealthChecks("/health");

// Reading the value validates it, so a bad configuration fails here before the database is touched
var databaseOptions = app.Services.GetRequiredService<IOptions<DatabaseOptions>>().Value;
if (databaseOptions.MigrateOnStartup)
{
    // Development only (enforced by DatabaseOptionsValidator); other environments apply reviewed migration scripts
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();

static void ConfigureAiHttpClient(IServiceProvider services, HttpClient client) =>
    client.Timeout = TimeSpan.FromSeconds(services.GetRequiredService<IOptions<AiOptions>>().Value.TimeoutSeconds);

// Exposes the entry point to WebApplicationFactory in integration tests
public partial class Program { }

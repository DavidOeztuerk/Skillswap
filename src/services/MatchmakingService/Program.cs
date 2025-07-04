using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Infrastructure.Extensions;
using Infrastructure.Security;
using CQRS.Extensions;
using MatchmakingService.Application.Commands;
using MatchmakingService.Application.Queries;
using MediatR;
using MatchmakingService;
using MatchmakingService.Consumer;
using Infrastructure.Services;
using EventSourcing;
using Infrastructure.Models;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "MatchmakingService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";

// JWT Configuration
var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer not configured");

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JWT Audience not configured");

// Add shared infrastructure
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

// builder.Services.AddMemoryCache();

var userServiceUrl = Environment.GetEnvironmentVariable("USERSERVICE_URL") ?? "http://userservice:5001";
builder.Services.AddHttpClient<IUserLookupService, UserLookupService>(client =>
{
    client.BaseAddress = new Uri(userServiceUrl);
});

// Add database
builder.Services.AddDbContext<MatchmakingDbContext>(options =>
{
    options.UseInMemoryDatabase("MatchmakingServiceDb");
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});

// Event sourcing setup
builder.Services.AddEventSourcing("MatchmakingEventStore");

// Add CQRS
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? "localhost:6379"; // Default Redis connection string
builder.Services.AddCQRSWithRedis(redisConnectionString, Assembly.GetExecutingAssembly());

// Add MassTransit
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<SkillCreatedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ReceiveEndpoint("matchmaking-skill-queue", e =>
        {
            e.ConfigureConsumer<SkillCreatedConsumer>(context);
        });
    });
});

// Add JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero
        };
    });

// Add authorization
builder.Services.AddSkillSwapAuthorization();

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "SkillSwap MatchmakingService API",
        Version = "v1",
        Description = "Intelligent skill matching service with CQRS architecture"
    });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Use shared infrastructure middleware
app.UseSharedInfrastructure();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MatchmakingService API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseAuthentication();
app.UseAuthorization();

#region Match Requests Endpoints
RouteGroupBuilder matchRequests = app.MapGroup("/matches/requests").RequireAuthorization();

matchRequests.MapPost("/", CreateMatchRequest)
    .WithName("CreateMatchRequest")
    .WithSummary("Create a direct match request to another user")
    .WithDescription("Send a match request to another user for a specific skill")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<MatchRequestResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest);

matchRequests.MapGet("/incoming", GetIncomingMatchRequests)
    .WithName("GetIncomingMatchRequests")
    .WithSummary("Get incoming match requests")
    .WithDescription("Retrieve all incoming match requests for the current user")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<PagedResponse<MatchRequestResponse>>(StatusCodes.Status200OK);

matchRequests.MapGet("/outgoing", GetOutgoingMatchRequests)
    .WithName("GetOutgoingMatchRequests")
    .WithSummary("Get outgoing match requests")
    .WithDescription("Retrieve all outgoing match requests from the current user")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<PagedResponse<MatchRequestResponse>>(StatusCodes.Status200OK);

matchRequests.MapPost("/{requestId}/accept", AcceptMatchRequest)
    .WithName("AcceptMatchRequest")
    .WithSummary("Accept a direct match request")
    .WithDescription("Accept an incoming match request and create a match")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<AcceptDirectMatchRequestResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matchRequests.MapPost("/{requestId}/reject", RejectMatchRequest)
    .WithName("RejectMatchRequest")
    .WithSummary("Reject a direct match request")
    .WithDescription("Reject an incoming match request with optional reason")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<RejectMatchRequestResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

// Helper functions for match requests
static async Task<IResult> CreateMatchRequest(IMediator mediator, HttpContext ctx, CreateMatchRequestCommand command)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendCommand(command with { UserId = userId });
}

static async Task<IResult> GetIncomingMatchRequests(IMediator mediator, HttpContext ctx, [AsParameters] GetIncomingMatchRequestsQuery query)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendQuery(query with { UserId = userId });
}

static async Task<IResult> GetOutgoingMatchRequests(IMediator mediator, HttpContext ctx, [AsParameters] GetOutgoingMatchRequestsQuery query)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendQuery(query with { UserId = userId });
}

static async Task<IResult> AcceptMatchRequest(IMediator mediator, HttpContext ctx, string requestId, AcceptMatchRequestCommand command)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendCommand(command with { UserId = userId, RequestId = requestId });
}

static async Task<IResult> RejectMatchRequest(IMediator mediator, HttpContext ctx, string requestId, RejectMatchRequestCommand command)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendCommand(command with { UserId = userId, RequestId = requestId });
}
#endregion

#region Matching Endpoints
RouteGroupBuilder matches = app.MapGroup("/matches").RequireAuthorization();

matches.MapPost("/find", FindMatch)
    .WithName("FindMatch")
    .WithSummary("Find skill matches")
    .WithDescription("Search for automated skill matches based on compatibility")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<FindMatchResponse>(StatusCodes.Status200OK);

matches.MapPost("/{matchId}/accept", AcceptMatch)
    .WithName("AcceptMatch")
    .WithSummary("Accept a match")
    .WithDescription("Accept an existing match proposal")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<AcceptMatchResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matches.MapPost("/{matchId}/reject", RejectMatch)
    .WithName("RejectMatch")
    .WithSummary("Reject a match")
    .WithDescription("Reject an existing match proposal with optional reason")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<RejectMatchResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matches.MapGet("/{matchId}", GetMatchDetails)
    .WithName("GetMatchDetails")
    .WithSummary("Get match details")
    .WithDescription("Retrieve detailed information about a specific match")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<MatchDetailsResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matches.MapGet("/my", GetUserMatches)
    .WithName("GetMyMatches")
    .WithSummary("Get my matches")
    .WithDescription("Retrieve all matches for the current user")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<PagedResponse<UserMatchResponse>>(StatusCodes.Status200OK);

// Helper functions for matches
static async Task<IResult> FindMatch(IMediator mediator, HttpContext ctx, FindMatchCommand command)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendCommand(command with { UserId = userId });
}

static async Task<IResult> AcceptMatch(IMediator mediator, HttpContext ctx, string matchId)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AcceptMatchCommand(matchId) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> RejectMatch(IMediator mediator, HttpContext ctx, string matchId, string? reason = null)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RejectMatchCommand(matchId, reason) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> GetMatchDetails(IMediator mediator, string matchId)
{
    var query = new GetMatchDetailsQuery(matchId);
    return await mediator.SendQuery(query);
}

static async Task<IResult> GetUserMatches(IMediator mediator, HttpContext ctx, [AsParameters] GetUserMatchesQuery query)
{
    var userId = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(userId) ? Results.Unauthorized() : await mediator.SendQuery(query with { UserId = userId });
}
#endregion

#region Analytics Endpoints
RouteGroupBuilder analytics = app.MapGroup("/analytics");

analytics.MapGet("/statistics", GetMatchStatistics)
    .WithName("GetMatchStatistics")
    .WithSummary("Get matching statistics")
    .WithDescription("Retrieve overall matching statistics and insights")
    .WithTags("Analytics")
    .WithOpenApi()
    .Produces<MatchStatisticsResponse>(StatusCodes.Status200OK);

static async Task<IResult> GetMatchStatistics(IMediator mediator, [AsParameters] GetMatchStatisticsQuery query)
{
    return await mediator.SendQuery(query);
}
#endregion

#region Health Checks
app.MapGet("/health/ready", async (MatchmakingDbContext dbContext) =>
{
    try
    {
        await dbContext.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready", timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Health check failed: {ex.Message}");
    }
})
.WithName("HealthReady")
.WithTags("Health");

app.MapGet("/health/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
.WithName("HealthLive")
.WithTags("Health");
#endregion

// Database initialization - ✅ ERWEITERT für neue Entity
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<MatchmakingDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        app.Logger.LogInformation("MatchmakingService database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing MatchmakingService database");
    }
}

app.Logger.LogInformation("Starting {ServiceName} with intelligent skill matching capabilities", serviceName);
app.Run();
using System.Reflection;
using System.Text;
using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RabbitMQ.Client;
using CQRS.Extensions;
using MatchmakingService.Application.Commands;
using MatchmakingService.Application.Queries;
using Contracts.Matchmaking.Requests;
using Contracts.Matchmaking.Responses;
using MatchmakingService.Extensions;
using System.Security.Claims;
using MediatR;
using MatchmakingService;
using MatchmakingService.Consumer;
using EventSourcing;
using Microsoft.AspNetCore.Mvc;
using Infrastructure.Extensions;
using Infrastructure.Security;
using CQRS.Models;

// ============================================================================
// PERFORMANCE OPTIMIZATION - Thread Pool Configuration
// ============================================================================
ThreadPool.SetMinThreads(200, 200);
ThreadPool.SetMaxThreads(1000, 1000);
AppContext.SetSwitch("System.Runtime.ServerGarbageCollection", true);

Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] MatchmakingService starting...");
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Thread Pool - Min Threads: 200, Max Threads: 1000");

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================
var serviceName = "MatchmakingService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST")
    ?? builder.Configuration["RabbitMQ:Host"]
    ?? "rabbitmq";

var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer not configured");

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JWT Audience not configured");

var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE")
    ?? builder.Configuration["JwtSettings:ExpireMinutes"]
    ?? "60";

var expireMinutes = int.TryParse(expireString, out var tmp) ? tmp : 60;

// ============================================================================
// SHARED INFRASTRUCTURE & HTTP CLIENTS
// ============================================================================
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

builder.Services.AddHttpContextAccessor();

var gatewayUrl = Environment.GetEnvironmentVariable("GATEWAY_URL") ?? "http://gateway:8080";

builder.Services.AddHttpClient<MatchmakingService.Infrastructure.HttpClients.IUserServiceClient,
    MatchmakingService.Infrastructure.HttpClients.UserServiceClient>(client =>
{
    client.BaseAddress = new Uri($"{gatewayUrl}/api/");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<MatchmakingService.Infrastructure.HttpClients.ISkillServiceClient,
    MatchmakingService.Infrastructure.HttpClients.SkillServiceClient>(client =>
{
    client.BaseAddress = new Uri($"{gatewayUrl}/api/");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ============================================================================
// DATABASE SETUP
// ============================================================================
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
        ?? throw new InvalidOperationException("POSTGRES_PASSWORD environment variable is required");
    connectionString =
        $"Host=postgres_userservice;Database=userservice;Username={pgUser};Password={pgPass};Port=5432;Trust Server Certificate=true";
}

builder.Services.AddDbContext<MatchmakingDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null))
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event Sourcing
builder.Services.AddEventSourcing("MatchmakingEventStore");

// ============================================================================
// CQRS & CACHING
// ============================================================================
var redisConnectionString =
    Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"]
    ?? "redis:6379";

builder.Services
    .AddCaching(redisConnectionString)
    .AddCQRS(Assembly.GetExecutingAssembly());

// Add MatchmakingService-specific dependencies
builder.Services.AddMatchmakingServiceDependencies();

// ============================================================================
// MESSAGE BUS (MassTransit + RabbitMQ)
// ============================================================================
var rabbitMqConnection =
    Environment.GetEnvironmentVariable("RABBITMQ_CONNECTION")
    ?? builder.Configuration.GetConnectionString("RabbitMQ")
    ?? $"amqp://guest:guest@{rabbitHost}:5672";

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

        cfg.ConfigureEndpoints(context);
    });

    x.ConfigureHealthCheckOptions(opt =>
    {
        opt.Name = "masstransit";
        opt.Tags.Add("ready");
        opt.MinimalFailureStatus = HealthStatus.Unhealthy;
    });
});

// ============================================================================
// AUTHN / AUTHZ
// ============================================================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;
        opts.MapInboundClaims = false;

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

        opts.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception is SecurityTokenExpiredException)
                    context.Response.Headers.Append("Token-Expired", "true");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = JsonSerializer.Serialize(new { error = "unauthorized", message = "You are not authorized to access this resource" });
                return context.Response.WriteAsync(result);
            }
        };
    });

builder.Services.AddSkillSwapAuthorization();

// ============================================================================
// SWAGGER
// ============================================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SkillSwap MatchmakingService API",
        Version = "v1",
        Description = "Intelligent skill matching service with CQRS architecture"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================================================
// HEALTH CHECKS (BEFORE app.Build())
// ============================================================================
var rabbitConn = new Lazy<Task<IConnection>>(() =>
{
    var factory = new ConnectionFactory { Uri = new Uri(rabbitMqConnection) };
    return factory.CreateConnectionAsync();
});

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    .AddDbContextCheck<MatchmakingDbContext>(name: "postgresql", tags: new[] { "ready", "db" })
    .AddRedis(redisConnectionString, name: "redis", tags: new[] { "ready", "cache" }, timeout: TimeSpan.FromSeconds(2))
    .AddRabbitMQ(sp => rabbitConn.Value, name: "rabbitmq", tags: new[] { "ready", "messaging" }, timeout: TimeSpan.FromSeconds(2));

// ============================================================================
// BUILD APPLICATION
// ============================================================================
var app = builder.Build();

// DB Migration + Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MatchmakingDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });

    app.Logger.LogInformation("Database migration completed successfully");
}

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================
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

// ============================================================================
// HEALTH ENDPOINTS
// ============================================================================
static Task WriteHealthResponse(HttpContext ctx, HealthReport report)
{
    ctx.Response.ContentType = "application/json";
    var payload = new
    {
        status = report.Status.ToString(),
        timestamp = DateTime.UtcNow,
        durationMs = report.TotalDuration.TotalMilliseconds,
        checks = report.Entries.Select(e => new
        {
            name = e.Key,
            status = e.Value.Status.ToString(),
            durationMs = e.Value.Duration.TotalMilliseconds,
            tags = e.Value.Tags,
            error = e.Value.Exception?.Message
        })
    };
    return ctx.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }));
}

app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = r => r.Tags.Contains("live"),
    ResponseWriter = WriteHealthResponse,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status200OK
    }
});

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = r => r.Tags.Contains("ready"),
    ResponseWriter = WriteHealthResponse,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status503ServiceUnavailable,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = WriteHealthResponse
});

// ============================================================================
// ENDPOINT MAPPINGS
// ============================================================================
#region Match Requests Endpoints
RouteGroupBuilder matchRequests = app.MapGroup("/matches/requests").RequireAuthorization();

matchRequests.MapPost("/", CreateMatchRequest)
    .WithName("CreateMatchRequest")
    .WithSummary("Create a direct match request to another user")
    .WithDescription("Send a match request to another user for a specific skill")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<CreateMatchRequestResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest);

matchRequests.MapGet("/incoming", GetIncomingMatchRequests)
    .WithName("GetIncomingMatchRequests")
    .WithSummary("Get incoming match requests")
    .WithDescription("Retrieve all incoming match requests for the current user")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<PagedResponse<MatchRequestDisplayResponse>>(StatusCodes.Status200OK);

matchRequests.MapGet("/outgoing", GetOutgoingMatchRequests)
    .WithName("GetOutgoingMatchRequests")
    .WithSummary("Get outgoing match requests")
    .WithDescription("Retrieve all outgoing match requests from the current user")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<PagedResponse<MatchRequestDisplayResponse>>(StatusCodes.Status200OK);

matchRequests.MapPost("/{requestId}/accept", AcceptMatchRequest)
    .WithName("AcceptMatchRequest")
    .WithSummary("Accept a direct match request")
    .WithDescription("Accept an incoming match request and create a match")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<ApiResponse<AcceptMatchRequestResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matchRequests.MapPost("/{requestId}/reject", RejectMatchRequest)
    .WithName("RejectMatchRequest")
    .WithSummary("Reject a direct match request")
    .WithDescription("Reject an incoming match request with optional reason")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<ApiResponse<RejectMatchRequestResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matchRequests.MapGet("/thread/{threadId}", GetMatchRequestThread)
    .WithName("GetMatchRequestThread")
    .WithSummary("Get match request thread")
    .WithDescription("Get all requests in a thread between two users for a skill")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<ApiResponse<MatchRequestThreadResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matchRequests.MapPost("/{requestId}/counter", CreateCounterOffer)
    .WithName("CreateCounterOffer")
    .WithSummary("Create a counter offer for a match request")
    .WithDescription("Respond to a match request with a counter offer")
    .WithTags("Match Requests")
    .WithOpenApi()
    .Produces<ApiResponse<CreateMatchRequestResponse>>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status404NotFound);

// ============================================================================
// HANDLER METHODS - MATCH REQUESTS
// ============================================================================

static async Task<IResult> CreateMatchRequest(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateMatchRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateMatchRequestCommand(
        request.SkillId,
        request.TargetUserId,
        request.Message,
        request.IsSkillExchange,
        request.ExchangeSkillId,
        request.IsMonetary,
        request.OfferedAmount,
        request.Currency,
        request.SessionDurationMinutes,
        request.TotalSessions,
        request.PreferredDays,
        request.PreferredTimes)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> GetIncomingMatchRequests(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetIncomingMatchRequestsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetIncomingMatchRequestsQuery(userId, request.PageNumber, request.PageSize);

    return await mediator.SendQuery(query);
}

static async Task<IResult> GetOutgoingMatchRequests(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetOutgoingMatchRequestsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetOutgoingMatchRequestsQuery(userId, request.PageNumber, request.PageSize);

    return await mediator.SendQuery(query);
}

static async Task<IResult> AcceptMatchRequest(IMediator mediator, ClaimsPrincipal user, [FromRoute] string requestId, [FromBody] AcceptMatchProposalRequest? request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AcceptMatchRequestCommand(requestId, request?.ResponseMessage)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> RejectMatchRequest(IMediator mediator, ClaimsPrincipal user, [FromRoute] string requestId, [FromBody] RejectMatchRequestRequest? request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RejectMatchRequestCommand(requestId, request?.ResponseMessage)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> GetMatchRequestThread(IMediator mediator, ClaimsPrincipal user, [FromRoute] string threadId)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetMatchRequestThreadQuery(threadId);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateCounterOffer(
    IMediator mediator, 
    ClaimsPrincipal user, 
    [FromRoute] string requestId, 
    [FromBody] CreateCounterOfferRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateCounterOfferCommand(
        requestId,
        request.Message,
        request.IsSkillExchange,
        request.ExchangeSkillId,
        request.ExchangeSkillName,
        request.IsMonetaryOffer,
        request.OfferedAmount,
        "EUR",  // Default currency
        request.PreferredDays,
        request.PreferredTimes,
        request.SessionDurationMinutes ?? 60,
        request.TotalSessions ?? 1)
    {
        UserId = userId,
        OriginalRequestId = requestId
    };

    return await mediator.SendCommand(command);
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

matches.MapPost("/{matchId}/complete", CompleteMatch)
    .WithName("CompleteMatch")
    .WithSummary("Complete a match")
    .WithDescription("Mark a match as completed with optional rating and feedback")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<CompleteMatchResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

matches.MapPost("/{matchId}/dissolve", DissolveMatch)
    .WithName("DissolveMatch")
    .WithSummary("Dissolve a match")
    .WithDescription("Dissolve an active match with a reason")
    .WithTags("Matching")
    .WithOpenApi()
    .Produces<DissolveMatchResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

// ============================================================================
// HANDLER METHODS - MATCHES
// ============================================================================

static async Task<IResult> FindMatch(IMediator mediator, ClaimsPrincipal user, [FromBody] FindMatchRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new FindMatchCommand(request.SkillId, request.SkillName, request.IsOffering, request.PreferredTags, request.RemoteOnly, request.MaxDistanceKm)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> AcceptMatch(IMediator mediator, ClaimsPrincipal user, string matchId)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AcceptMatchCommand(matchId)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> RejectMatch(IMediator mediator, ClaimsPrincipal user, string matchId, [FromBody] RejectMatchRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RejectMatchCommand(matchId, request.Reason)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> GetMatchDetails(IMediator mediator, ClaimsPrincipal user, string matchId)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetMatchDetailsQuery(matchId);

    return await mediator.SendQuery(query);
}

static async Task<IResult> GetUserMatches(
    IMediator mediator,
    ClaimsPrincipal user,
    string? status = null,
    bool includeCompleted = true,
    int pageNumber = 1,
    int pageSize = 20)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserMatchesQuery(userId, status, includeCompleted, pageNumber, pageSize);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CompleteMatch(IMediator mediator, ClaimsPrincipal user, string matchId, [FromBody] CompleteMatchRequest? request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CompleteMatchCommand(
        matchId,
        request?.SessionDurationMinutes,
        request?.Feedback,
        request?.Rating)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> DissolveMatch(IMediator mediator, ClaimsPrincipal user, string matchId, [FromBody] DissolveMatchRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(request?.Reason))
    {
        return Results.BadRequest("Reason is required for dissolving a match");
    }

    var command = new DissolveMatchCommand(matchId, request.Reason)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
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

// ============================================================================
// HANDLER METHODS - ANALYTICS
// ============================================================================

static async Task<IResult> GetMatchStatistics(IMediator mediator, ClaimsPrincipal user, [FromBody] GetMatchStatisticsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetMatchStatisticsQuery(request.FromDate, request.ToDate);

    return await mediator.SendQuery(query);
}
#endregion

// ============================================================================
// START APPLICATION
// ============================================================================
app.Logger.LogInformation("Starting {ServiceName}", serviceName);
app.Logger.LogInformation("JWT Configuration: Issuer={Issuer}, Audience={Audience}, Expiry={Expiry}min",
    issuer, audience, expireMinutes);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
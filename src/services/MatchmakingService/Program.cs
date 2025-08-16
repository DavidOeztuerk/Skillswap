using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
// using Infrastructure.Services;
using EventSourcing;
// using MatchmakingService.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Infrastructure.Extensions;
using Infrastructure.Security;
using CQRS.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();

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

// Add HttpContextAccessor for forwarding authentication
builder.Services.AddHttpContextAccessor();

// builder.Services.AddMemoryCache();

// Register HTTP Clients for service communication
var gatewayUrl = Environment.GetEnvironmentVariable("GATEWAY_URL") ?? "http://gateway:8080";

builder.Services.AddHttpClient<MatchmakingService.Infrastructure.HttpClients.IUserServiceClient,
    MatchmakingService.Infrastructure.HttpClients.UserServiceClient>(client =>
{
    client.BaseAddress = new Uri($"{gatewayUrl}/api/");
});

builder.Services.AddHttpClient<MatchmakingService.Infrastructure.HttpClients.ISkillServiceClient,
    MatchmakingService.Infrastructure.HttpClients.SkillServiceClient>(client =>
{
    client.BaseAddress = new Uri($"{gatewayUrl}/api/");
});

// Add database
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

// 2) Service-spezifischer Fallback (nur wenn wirklich nichts gesetzt ist)
if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "skillswap@ditss1990?!";
    connectionString =
        $"Host=postgres_userservice;Database=userservice;Username={pgUser};Password={pgPass};Port=5432;Trust Server Certificate=true";
}

builder.Services.AddDbContext<MatchmakingDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)) // EF-Retry einschalten
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event sourcing setup
builder.Services.AddEventSourcing("MatchmakingEventStore");

// Add CQRS
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? "localhost:6379"; // Default Redis connection string

builder.Services.AddCaching(redisConnectionString).AddCQRS(Assembly.GetExecutingAssembly());

// Add MatchmakingService-specific dependencies
builder.Services.AddMatchmakingServiceDependencies();

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

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MatchmakingDbContext>();
    // EF-eigene ExecutionStrategy, damit auch die Verbindungserstellung retried wird
    var strategy = db.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(async () =>
    {
        await db.Database.MigrateAsync();           // ← statt EnsureCreated
        // optional: Seeding
        // await MatchmakingSeedData.SeedAsync(db);
    });
    app.Logger.LogInformation("Database migration completed successfully");
}

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
        await context.Database.EnsureDeletedAsync();
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
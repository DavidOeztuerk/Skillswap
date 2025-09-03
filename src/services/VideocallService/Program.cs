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
using Infrastructure.Extensions;
using Infrastructure.Security;
using CQRS.Extensions;
using VideocallService.Application.Commands;
using VideocallService.Application.Queries;
using MediatR;
using EventSourcing;
using VideocallService;
using VideocallService.Consumer;
using VideocallService.Hubs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Contracts.VideoCall.Requests;

// ============================================================================
// PERFORMANCE OPTIMIZATION - Thread Pool Configuration
// ============================================================================
ThreadPool.SetMinThreads(200, 200);
ThreadPool.SetMaxThreads(1000, 1000);
AppContext.SetSwitch("System.Runtime.ServerGarbageCollection", true);

Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] VideocallService starting...");
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Thread Pool - Min Threads: 200, Max Threads: 1000");

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================
var serviceName = "VideocallService";
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
// SHARED INFRASTRUCTURE & SIGNALR
// ============================================================================
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

// Add SignalR for real-time communication
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
    options.StreamBufferCapacity = 10;
});

// Add CORS for SignalR
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
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

builder.Services.AddDbContext<VideoCallDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null))
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event Sourcing
builder.Services.AddEventSourcing("VideocallEventStore");

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

// ============================================================================
// MESSAGE BUS (MassTransit + RabbitMQ)
// ============================================================================
var rabbitMqConnection =
    Environment.GetEnvironmentVariable("RABBITMQ_CONNECTION")
    ?? builder.Configuration.GetConnectionString("RabbitMQ")
    ?? $"amqp://guest:guest@{rabbitHost}:5672";

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<AppointmentAcceptedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ReceiveEndpoint("videocall-appointment-queue", e =>
        {
            e.ConfigureConsumer<AppointmentAcceptedConsumer>(context);
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

        // Configure JWT for SignalR
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/videocall"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
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
        Title = "SkillSwap VideocallService API",
        Version = "v1",
        Description = "Real-time video calling service with WebRTC and SignalR"
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
    .AddDbContextCheck<VideoCallDbContext>(name: "postgresql", tags: new[] { "ready", "db" })
    .AddRedis(redisConnectionString, name: "redis", tags: new[] { "ready", "cache" }, timeout: TimeSpan.FromSeconds(2))
    .AddRabbitMQ(sp => rabbitConn.Value, name: "rabbitmq", tags: new[] { "ready", "messaging" }, timeout: TimeSpan.FromSeconds(2));

// ============================================================================
// BUILD APPLICATION
// ============================================================================
var app = builder.Build();

// DB Migration + Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VideoCallDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });

    app.Logger.LogInformation("Database migration completed successfully");
}

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VideocallService API v1");
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
// SIGNALR HUB & ENDPOINT MAPPINGS
// ============================================================================

// SignalR Hub for real-time video calling
app.MapHub<VideoCallHub>("/videocall")
    .RequireAuthorization();

// Grouped endpoints for calls
var calls = app.MapGroup("/calls").WithTags("VideoCalls");

calls.MapPost("/create", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CreateCallSessionRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateCallSessionCommand(userId, request.AppointmentId, null, false, request.MaxParticipants) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("CreateCallSession")
.WithSummary("Create a new video call session")
.WithDescription("Creates a new video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/join", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] JoinCallRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new JoinCallCommand(request.SessionId, request.ConnectionId, request.CameraEnabled, request.MicrophoneEnabled, request.DeviceInfo) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("JoinCall")
.WithSummary("Join a video call session")
.WithDescription("Joins a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/leave", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] LeaveCallRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new LeaveCallCommand(request.SessionId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("LeaveCall")
.WithSummary("Leave a video call session")
.WithDescription("Leaves a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/start", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] StartCallRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new StartCallCommand(request.SessionId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("StartCall")
.WithSummary("Start a video call session")
.WithDescription("Starts a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/end", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] EndCallRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new EndCallCommand(request.SessionId, request.DurationSeconds, request.Rating, request.Feedback) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("EndCall")
.WithSummary("End a video call session")
.WithDescription("Ends a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapGet("/{sessionId}", async (IMediator mediator, ClaimsPrincipal claims, string sessionId) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetCallSessionQuery(sessionId);
    return await mediator.SendQuery(query);
})
.WithName("GetCallSession")
.WithSummary("Get call session details")
.WithDescription("Retrieves details for a specific call session.");

// Grouped endpoints for user call history
var myCalls = app.MapGroup("/my/calls").WithTags("VideoCalls");
myCalls.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetUserCallHistoryRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserCallHistoryQuery(userId, request.FromDate, request.ToDate, request.Status, request.PageNumber, request.PageSize);
    return await mediator.SendQuery(query);
})
.WithName("GetMyCallHistory")
.WithSummary("Get my call history")
.WithDescription("Retrieves the authenticated user's call history.")
.RequireAuthorization();

// Grouped endpoints for analytics
var analytics = app.MapGroup("/statistics").WithTags("Analytics");
analytics.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetCallStatisticsRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetCallStatisticsQuery(request.FromDate, request.ToDate);
    return await mediator.SendQuery(query);
})
.WithName("GetCallStatistics")
.WithSummary("Get call statistics")
.WithDescription("Retrieves call statistics.");

// ============================================================================
// START APPLICATION
// ============================================================================
app.Logger.LogInformation("Starting {ServiceName}", serviceName);
app.Logger.LogInformation("JWT Configuration: Issuer={Issuer}, Audience={Audience}, Expiry={Expiry}min",
    issuer, audience, expireMinutes);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
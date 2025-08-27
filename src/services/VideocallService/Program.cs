using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

var builder = WebApplication.CreateBuilder(args);

var serviceName = "VideocallService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") 
    ?? builder.Configuration["RabbitMQ:Host"] 
    ?? "localhost";

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

// Add SignalR for real-time communication
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
    options.StreamBufferCapacity = 10;
});

// Add database
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

// 2) Service-spezifischer Fallback (nur wenn wirklich nichts gesetzt ist)
if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? throw new InvalidOperationException("POSTGRES_PASSWORD environment variable is required");
    connectionString =
        $"Host=postgres_userservice;Database=userservice;Username={pgUser};Password={pgPass};Port=5432;Trust Server Certificate=true";
}

builder.Services.AddDbContext<VideoCallDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)) // EF-Retry einschalten
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event sourcing setup
builder.Services.AddEventSourcing("VideocallEventStore");

// Add CQRS
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"] ?? throw new InvalidOperationException("Redis connection string not configured");
    
builder.Services.AddCaching(redisConnectionString).AddCQRS(Assembly.GetExecutingAssembly());

// Add MassTransit
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
    });
});

// Add JWT authentication with SignalR support
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
            }
        };
    });

// Add authorization
builder.Services.AddSkillSwapAuthorization();

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

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "SkillSwap VideocallService API",
        Version = "v1",
        Description = "Real-time video calling service with WebRTC and SignalR"
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

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VideoCallDbContext>();
    // EF-eigene ExecutionStrategy, damit auch die Verbindungserstellung retried wird
    var strategy = db.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(async () =>
    {
        await db.Database.MigrateAsync();           // ← statt EnsureCreated
        // optional: Seeding
        // await VideoCallSeedData.SeedAsync(db);
    });
    app.Logger.LogInformation("Database migration completed successfully");
}

// Use shared infrastructure middleware
app.UseSharedInfrastructure();

// Use CORS
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

// API Endpoints

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

// SignalR Hub for real-time video calling
app.MapHub<VideoCallHub>("/videocall")
    .RequireAuthorization();

// Grouped endpoints for health
var health = app.MapGroup("/health").WithTags("Health");
health.MapGet("/ready", async (VideoCallDbContext dbContext) =>
{
    try
    {
        await dbContext.Database.CanConnectAsync();
        return Results.Ok(new
        {
            status = "ready",
            timestamp = DateTime.UtcNow,
            signalr = "enabled"
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Health check failed: {ex.Message}");
    }
})
.WithName("HealthReady")
.WithSummary("Readiness check");

health.MapGet("/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
.WithName("HealthLive")
.WithSummary("Liveness check");

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VideoCallDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        app.Logger.LogInformation("VideocallService database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing VideocallService database");
    }
}

app.Logger.LogInformation("Starting {ServiceName} with real-time video calling capabilities", serviceName);
app.Run();
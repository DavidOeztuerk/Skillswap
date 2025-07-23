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

var builder = WebApplication.CreateBuilder(args);

var serviceName = "VideocallService";
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

// Add SignalR for real-time communication
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
    options.StreamBufferCapacity = 10;
});

// Add database
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");

if (string.IsNullOrEmpty(connectionString))
{
    // ✅ Intelligente Host-Erkennung
    var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true" ||
                               Environment.GetEnvironmentVariable("KUBERNETES_SERVICE_HOST") != null ||
                               File.Exists("/.dockerenv"); // Docker-spezifische Datei

    var host = isRunningInContainer ? "postgres" : "localhost";

    connectionString = Environment.GetEnvironmentVariable("DefaultConnection")
        ?? builder.Configuration.GetConnectionString("DefaultConnection")
        ?? $"Host={host};Database=skillswap;Username=skillswap;Password=skillswap@ditss1990?!;Port=5432;TrustServerCertificate=True;";

    // Falls Environment Variable einen anderen Host enthält, korrigieren
    if (connectionString.Contains("Host="))
    {
        connectionString = System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            @"Host=[^;]+",
            $"Host={host}"
        );
    }
}

// Debug-Ausgabe (ohne Passwort für Logs)
var safeConnectionString = connectionString.Contains("Password=")
    ? System.Text.RegularExpressions.Regex.Replace(connectionString, @"Password=[^;]*", "Password=***")
    : connectionString;

builder.Services.AddDbContext<VideoCallDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// Event sourcing setup
builder.Services.AddEventSourcing("VideocallEventStore");

// Add CQRS
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? "localhost:6379"; // Default Redis connection string
builder.Services.AddCQRSWithRedis(redisConnectionString, Assembly.GetExecutingAssembly());

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

calls.MapPost("/create", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CreateCallSessionCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("CreateCallSession")
.WithSummary("Create a new video call session")
.WithDescription("Creates a new video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/join", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] JoinCallCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("JoinCall")
.WithSummary("Join a video call session")
.WithDescription("Joins a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/leave", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] LeaveCallCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("LeaveCall")
.WithSummary("Leave a video call session")
.WithDescription("Leaves a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/start", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] StartCallCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("StartCall")
.WithSummary("Start a video call session")
.WithDescription("Starts a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapPost("/end", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] EndCallCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("EndCall")
.WithSummary("End a video call session")
.WithDescription("Ends a video call session for the authenticated user.")
.RequireAuthorization();

calls.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetCallSessionQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetCallSession")
.WithSummary("Get call session details")
.WithDescription("Retrieves details for a specific call session.");

// Grouped endpoints for user call history
var myCalls = app.MapGroup("/my/calls").WithTags("VideoCalls");
myCalls.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetUserCallHistoryQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetMyCallHistory")
.WithSummary("Get my call history")
.WithDescription("Retrieves the authenticated user's call history.")
.RequireAuthorization();

// Grouped endpoints for analytics
var analytics = app.MapGroup("/statistics").WithTags("Analytics");
analytics.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetCallStatisticsQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

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
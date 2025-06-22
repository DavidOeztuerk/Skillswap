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
using VideocallService;
using VideocallService.Consumer;
using VideocallService.Hubs;

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
builder.Services.AddDbContext<VideoCallDbContext>(options =>
{
    options.UseInMemoryDatabase("VideocallServiceDb");
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});

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
app.MapPost("/calls/create", async (IMediator mediator, HttpContext context, CreateCallSessionCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    command.UserId = userId;
    return await mediator.SendCommand(command);
})
.WithName("CreateCallSession")
.WithSummary("Create a new video call session")
.WithTags("VideoCalls")
.RequireAuthorization();

app.MapPost("/calls/{sessionId}/join", async (IMediator mediator, HttpContext context, string sessionId, JoinCallCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    command.UserId = userId;
    var updatedCommand = command with { SessionId = sessionId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("JoinCall")
.WithSummary("Join a video call session")
.WithTags("VideoCalls")
.RequireAuthorization();

app.MapPost("/calls/{sessionId}/leave", async (IMediator mediator, HttpContext context, string sessionId, string? reason = null) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new LeaveCallCommand(sessionId, reason) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("LeaveCall")
.WithSummary("Leave a video call session")
.WithTags("VideoCalls")
.RequireAuthorization();

app.MapPost("/calls/{sessionId}/start", async (IMediator mediator, HttpContext context, string sessionId) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new StartCallCommand(sessionId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("StartCall")
.WithSummary("Start a video call session")
.WithTags("VideoCalls")
.RequireAuthorization();

app.MapPost("/calls/{sessionId}/end", async (IMediator mediator, HttpContext context, string sessionId, EndCallCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    command.UserId = userId;
    var updatedCommand = command with { SessionId = sessionId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("EndCall")
.WithSummary("End a video call session")
.WithTags("VideoCalls")
.RequireAuthorization();

app.MapGet("/calls/{sessionId}", async (IMediator mediator, string sessionId) =>
{
    var query = new GetCallSessionQuery(sessionId);
    return await mediator.SendQuery(query);
})
.WithName("GetCallSession")
.WithSummary("Get call session details")
.WithTags("VideoCalls");

app.MapGet("/my/calls", async (IMediator mediator, HttpContext context, [AsParameters] GetUserCallHistoryQuery query) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetMyCallHistory")
.WithSummary("Get my call history")
.WithTags("VideoCalls")
.RequireAuthorization();

app.MapGet("/statistics", async (IMediator mediator, [AsParameters] GetCallStatisticsQuery query) =>
{
    return await mediator.SendQuery(query);
})
.WithName("GetCallStatistics")
.WithSummary("Get call statistics")
.WithTags("Analytics");

// SignalR Hub for real-time video calling
app.MapHub<VideoCallHub>("/videocall")
    .RequireAuthorization();

// Health checks
app.MapGet("/health/ready", async (VideoCallDbContext dbContext) =>
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
.WithTags("Health");

app.MapGet("/health/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
.WithName("HealthLive")
.WithTags("Health");

// Helper method
static string? ExtractUserIdFromContext(HttpContext context)
{
    return context.User.FindFirst("user_id")?.Value
           ?? context.User.FindFirst("sub")?.Value
           ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}

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
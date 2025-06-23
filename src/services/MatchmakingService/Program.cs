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
using Contracts.Users;

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

builder.Services.AddMemoryCache();

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

// API Endpoints
app.MapPost("/matches/find", async (IMediator mediator, HttpContext context, FindMatchCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    command.UserId = userId;
    return await mediator.SendCommand(command);
})
.WithName("FindMatch")
.WithSummary("Find skill matches")
.WithTags("Matching")
.RequireAuthorization();

app.MapPost("/matches/{matchId}/accept", async (IMediator mediator, HttpContext context, string matchId) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AcceptMatchCommand(matchId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("AcceptMatch")
.WithSummary("Accept a match")
.WithTags("Matching")
.RequireAuthorization();

app.MapPost("/matches/{matchId}/reject", async (IMediator mediator, HttpContext context, string matchId, string? reason = null) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RejectMatchCommand(matchId, reason) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("RejectMatch")
.WithSummary("Reject a match")
.WithTags("Matching")
.RequireAuthorization();

app.MapGet("/matches/{matchId}", async (IMediator mediator, string matchId) =>
{
    var query = new GetMatchDetailsQuery(matchId);
    return await mediator.SendQuery(query);
})
.WithName("GetMatchDetails")
.WithSummary("Get match details")
.WithTags("Matching");

app.MapGet("/my/matches", async (IMediator mediator, HttpContext context, [AsParameters] GetUserMatchesQuery query) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetMyMatches")
.WithSummary("Get my matches")
.WithTags("Matching")
.RequireAuthorization();

app.MapGet("/statistics", async (IMediator mediator, [AsParameters] GetMatchStatisticsQuery query) =>
{
    return await mediator.SendQuery(query);
})
.WithName("GetMatchStatistics")
.WithSummary("Get matching statistics")
.WithTags("Analytics");

// Health checks
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
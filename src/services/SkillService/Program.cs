using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using EventSourcing;
using Infrastructure.Security;
using Infrastructure.Middleware;
using CQRS.Extensions;
using SkillService.Application.Commands;
using SkillService.Application.Queries;
using Contracts.Skill.Requests;
using Contracts.Skill.Responses;
using SkillService.Extensions;
using System.Security.Claims;
using Infrastructure.Models;
using MediatR;
using SkillService;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using CQRS.Models;
using RabbitMQ.Client;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.OpenApi.Models;
using SkillService.Infrastructure.Data;

// ============================================================================
// PERFORMANCE OPTIMIZATION - Thread Pool Configuration
// ============================================================================
ThreadPool.SetMinThreads(200, 200);  // Start with 200 worker and I/O threads
ThreadPool.SetMaxThreads(1000, 1000); // Maximum 1000 threads

// Optional: Configure Garbage Collection for better performance
AppContext.SetSwitch("System.Runtime.ServerGarbageCollection", true);

Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] SkillService starting...");
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Thread Pool - Min Threads: 200, Max Threads: 1000");

var builder = WebApplication.CreateBuilder(args);

var serviceName = "SkillService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost";

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

builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

// 2) Service-spezifischer Fallback (nur wenn wirklich nichts gesetzt ist)
if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
        ?? throw new InvalidOperationException("POSTGRES_PASSWORD environment variable is required");
    connectionString =
        $"Host=postgres_userservice;Database=userservice;Username={pgUser};Password={pgPass};Port=5432;Trust Server Certificate=true";
}

builder.Services.AddDbContext<SkillDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)) 
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

builder.Services.AddEventSourcing("SkillServiceEventStore");


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
// HEALTH CHECKS SETUP
// ============================================================================
var rabbitMqConnection =
    Environment.GetEnvironmentVariable("RABBITMQ_CONNECTION")
    ?? builder.Configuration.GetConnectionString("RabbitMQ")
    ?? $"amqp://guest:guest@{rabbitHost}:5672";

builder.Services.AddMassTransit(x =>
{
    x.AddConsumers(Assembly.GetExecutingAssembly());

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
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

builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = secret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.ExpireMinutes = expireMinutes;
});

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
            ClockSkew = TimeSpan.Zero,
            NameClaimType = JwtRegisteredClaimNames.Sub,
            RoleClaimType = ClaimTypes.Role
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

builder.Services.AddSkillServiceDependencies();
builder.Services.AddSkillSwapAuthorization();
builder.Services.AddPermissionAuthorization();
builder.Services.AddAuthorization(options => options.AddPermissionPolicies());

builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SkillSwap SkillService API",
        Version = "v1",
        Description = "Comprehensive skill management service with CQRS architecture"
    });

    // Add JWT authentication to Swagger
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


var rabbitConn = new Lazy<Task<IConnection>>(() =>
{
    var factory = new ConnectionFactory { Uri = new Uri(rabbitMqConnection) };
    return factory.CreateConnectionAsync();
});

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    .AddDbContextCheck<SkillDbContext>(name: "postgresql", tags: new[] { "ready", "db" })
    .AddRedis(redisConnectionString, name: "redis", tags: new[] { "ready", "cache" }, timeout: TimeSpan.FromSeconds(2))
    .AddRabbitMQ(sp => rabbitConn.Value, name: "rabbitmq", tags: new[] { "ready", "messaging" }, timeout: TimeSpan.FromSeconds(2));

var app = builder.Build();

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SkillDbContext>();

   var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });


       await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });

    await strategy.ExecuteAsync(async () =>
    {
        using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            await SkillSeedData.SeedAsync(db);
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    });

    app.Logger.LogInformation("Database migration and seeding completed successfully");
}

builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);
app.UseMiddleware<RateLimitingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkillService API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseAuthentication();
app.UseAuthorization();
app.UsePermissionMiddleware();

#region Skills Endpoints
RouteGroupBuilder skills = app.MapGroup("/skills");

skills.MapGet("/", SearchSkills)
    .WithName("SearchSkills")
    .WithSummary("Search skills")
    .WithDescription("Search and filter skills with pagination")
    .WithTags("Skills")
    .WithOpenApi()
    .Produces<PagedResponse<SkillSearchResultResponse>>(StatusCodes.Status200OK);

skills.MapGet("/{id}", GetSkillById)
    .WithName("GetSkillDetails")
    .WithSummary("Get skill details")
    .WithDescription("Get detailed information about a specific skill")
    .WithTags("SkillDetail")
    .WithOpenApi()
    .Produces<ApiResponse<SkillDetailsResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status400BadRequest);

skills.MapGet("/my-skills", GetUserSkills)
    .WithName("GetUserSkills")
    .WithSummary("Get user skills")
    .WithDescription("Retrieve all skills for a specific user with pagination")
    .WithTags("UserSkills")
    .WithOpenApi()
    .Produces<PagedResponse<UserSkillResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

skills.MapPost("/", CreateNewSkill)
    .WithName("CreateSkill")
    .WithSummary("Create a new skill")
    .WithDescription("Create a new skill with the specified details")
    .WithTags("Skills")
    .WithOpenApi()
    .Produces<ApiResponse<CreateSkillResponse>>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization();

skills.MapPut("/{id}", UpdateSkill)
    .WithName("UpdateSkill")
    .WithSummary("Update an existing skill")
    .WithDescription("Update the details of an existing skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<ApiResponse<UpdateSkillResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization();

skills.MapDelete("/{id}", DeleteSkill)
    .WithName("DeleteSkill")
    .WithSummary("Delete a skill")
    .WithDescription("Delete a specific skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<ApiResponse<DeleteSkillResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

skills.MapPost("/{id}/rate", RateSkill)
    .WithName("RateSkill")
    .WithSummary("Rate a skill")
    .WithDescription("Rate a specific skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<ApiResponse<RateSkillResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

skills.MapPost("/{id}/endorse", EndorseSkill)
    .WithName("EndorseSkill")
    .WithSummary("Endorse a skill")
    .WithDescription("Endorse a specific skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<ApiResponse<EndorseSkillResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

static async Task<IResult> SearchSkills(
    IMediator mediator,
    ClaimsPrincipal user,
    [AsParameters] SearchSkillsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new SearchSkillsQuery(
        userId,
        request.SearchTerm,
        request.CategoryId,
        request.ProficiencyLevelId,
        request.Tags?.ToList(),
        request.IsOffered,
        request.MinRating,
        request.SortBy,
        request.SortDescending,
        request.PageNumber,
        request.PageSize);

    return await mediator.SendQuery(command);
}

static async Task<IResult> GetSkillById(
    IMediator mediator,
    ClaimsPrincipal user,
    [FromRoute] string id)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetSkillDetailsQuery(id);

    return await mediator.SendQuery(query);
}

static async Task<IResult> GetUserSkills(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetUserSkillsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserSkillsQuery(userId, request.IsOffered, request.CategoryId, request.ProficiencyLevelId, request.IncludeInactive, request.PageNumber, request.PageSize);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateNewSkill(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateSkillCommand(
        request.Name,
        request.Description,
        request.CategoryId,
        request.ProficiencyLevelId,
        request.Tags,
        request.IsOffered,
        request.AvailableHours,
        request.PreferredSessionDuration)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> UpdateSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] UpdateSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateSkillCommand(
        id,
        request.Name,
        request.Description,
        request.CategoryId,
        request.ProficiencyLevelId,
        request.Tags,
        request.IsOffered,
        request.AvailableHours,
        request.PreferredSessionDuration)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> DeleteSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] DeleteSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new DeleteSkillCommand(id, request.Reason)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> RateSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] RateSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RateSkillCommand(id, request.Rating, request.Comment, request.Tags)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> EndorseSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] EndorseSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new EndorseSkillCommand(id, request.EndorsedUserId, request.Comment)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

#endregion

#region Categories Endpoints
RouteGroupBuilder categories = skills.MapGroup("/categories");

categories.MapGet("/", GetCategories)
    .WithName("GetSkillCategories")
    .WithSummary("Get skill categories")
    .WithDescription("Retrieve all skill categories with pagination")
    .WithTags("SkillCategories")
    .WithOpenApi()
    .Produces<ApiResponse<GetSkillCategoriesResponse>>(StatusCodes.Status200OK);

categories.MapPost("/", CreateNewCategory)
    .WithName("CreateSkillCategory")
    .WithSummary("Create a new skill category")
    .WithDescription("Create a new skill category with the specified details")
    .WithTags("SkillCategories")
    .WithOpenApi()
    .Produces<ApiResponse<CreateSkillCategoryResponse>>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization(Policies.RequireAdminRole);

categories.MapPut("/{id}", UpdateCategory)
    .WithName("UpdateSkillCategory")
    .WithSummary("Update an existing skill category")
    .WithDescription("Update an existing skill category with the specified details")
    .WithTags("SkillCategories")
    .WithOpenApi()
    .Produces<ApiResponse<UpdateSkillCategoryResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization(Policies.RequireAdminRole);

static async Task<IResult> GetCategories(
    IMediator mediator)
{
    var query = new GetSkillCategoriesQuery();

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateNewCategory(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateSkillCategoryRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateSkillCategoryCommand(request.Name, request.Description, request.IconName, request.Color, request.SortOrder, request.IsActive)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> UpdateCategory(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] UpdateSkillCategoryRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateSkillCategoryCommand(id, request.Name, request.Description, request.IconName, request.Color, request.SortOrder, request.IsActive)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}
#endregion

#region Proficiency Levels
RouteGroupBuilder levels = skills.MapGroup("/proficiency-levels");

levels.MapGet("/", GetProficiencyLevels)
    .WithName("GetProficiencyLevels")
    .WithSummary("Get proficiency levels")
    .WithDescription("Retrieve all proficiency levels with pagination")
    .WithTags("ProficiencyLevels")
    .WithOpenApi()
    .Produces<ApiResponse<GetProficiencyLevelsResponse>>(StatusCodes.Status200OK);

levels.MapPost("/", CreateNewProficiencyLevel)
    .WithName("CreateProficiencyLevel")
    .WithSummary("Create a new proficiency level")
    .WithDescription("Create a new proficiency level with the specified details")
    .WithTags("ProficiencyLevels")
    .WithOpenApi()
    .Produces<ApiResponse<CreateProficiencyLevelResponse>>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization(Policies.RequireAdminRole);

static async Task<IResult> GetProficiencyLevels(
    IMediator mediator,
    [FromQuery] bool includeInactive = false,
    [FromQuery] bool includeSkillCounts = false)
{
    var query = new GetProficiencyLevelsQuery(includeInactive, includeSkillCounts);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateNewProficiencyLevel(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateProficiencyLevelRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateProficiencyLevelCommand(request.Level, request.Description, request.Rank, request.Color, request.IsActive)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}
#endregion

#region Analytics
RouteGroupBuilder analytics = skills.MapGroup("/analytics");

analytics.MapGet("/statistics", GetSkillStatistics)
    .WithName("GetSkillStatistics")
    .WithSummary("Get skill statistics")
    .WithDescription("Retrieve overall skill statistics including counts, ratings, and endorsements")
    .WithTags("Analytics")
    .WithOpenApi()
    .Produces<GetSkillStatisticsResponse>(StatusCodes.Status200OK);

analytics.MapGet("/popular-tags", GetPopularTags)
    .WithName("GetPopularTags")
    .WithSummary("Get popular tags")
    .WithDescription("Retrieve a list of popular tags based on user interactions")
    .WithTags("Analytics")
    .WithOpenApi()
    .Produces<GetPopularTagsResponse>(StatusCodes.Status200OK);

RouteGroupBuilder rec = skills.MapGroup("/recommendations")
    .RequireAuthorization();

rec.MapGet("/", GetSkillRecommendations)
    .WithName("GetSkillRecommendations")
    .WithSummary("Get skill recommendations")
    .WithDescription("Retrieve personalized skill recommendations for the user")
    .WithTags("Recommendations")
    .WithOpenApi()
    .Produces<GetSkillRecommendationsResponse>(StatusCodes.Status200OK);

// Removed duplicate health check mappings - they are already defined below

static async Task<IResult> GetSkillStatistics(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetSkillStatisticsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetSkillStatisticsQuery(request.FromDate, request.ToDate, request.CategoryId, request.UserId);

    return await mediator.SendQuery(query);
}

static async Task<IResult> GetPopularTags(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetPopularTagsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetPopularTagsQuery(request.CategoryId, request.MaxTags, request.MinUsageCount);

    return await mediator.SendQuery(query);
}

static async Task<IResult> GetSkillRecommendations(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetSkillRecommendationsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetSkillRecommendationsQuery(request.UserId, request.MaxRecommendations);

    return await mediator.SendQuery(query);
}

#endregion

// ============================================================================
// HEALTH CHECK ENDPOINTS
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

app.MapHealthChecks("/health/live", new HealthCheckOptions
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

app.MapHealthChecks("/health/ready", new HealthCheckOptions
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

app.MapHealthChecks("/health", new
HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = WriteHealthResponse
});

app.Logger.LogInformation("Starting {ServiceName} with comprehensive skill management capabilities", serviceName);
app.Run();

public partial class Program { }
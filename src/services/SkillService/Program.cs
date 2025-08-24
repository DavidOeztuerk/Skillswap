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

var builder = WebApplication.CreateBuilder(args);

var serviceName = "SkillService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";

var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer not configured");

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JWT Audience not configured");

builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

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

builder.Services.AddDbContext<SkillDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)) // EF-Retry einschalten
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

builder.Services.AddEventSourcing("SkillServiceEventStore");

var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"] ?? throw new InvalidOperationException("Redis connection string not configured");

builder.Services.AddCaching(redisConnectionString).AddCQRS(Assembly.GetExecutingAssembly());

// Add SkillService-specific dependencies
builder.Services.AddSkillServiceDependencies();

builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });
    });
});

builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = secret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.ExpireMinutes = 60;
});

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

builder.Services.AddSkillSwapAuthorization();

// Add permission-based authorization
builder.Services.AddPermissionAuthorization();
builder.Services.AddAuthorization(options =>
{
    options.AddPermissionPolicies();
});

builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "SkillSwap SkillService API",
        Version = "v1",
        Description = "Comprehensive skill management service with CQRS architecture"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkillService API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseSharedInfrastructure();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Permission middleware (after authentication/authorization)
app.UsePermissionMiddleware();

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SkillDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();
    
    // Execute migrations with retry strategy
    await strategy.ExecuteAsync(async () =>
    {
        await db.Database.MigrateAsync();
    });
    
    // Execute seeding with retry strategy
    await strategy.ExecuteAsync(async () =>
    {
        await SkillService.Infrastructure.Data.SkillSeedData.SeedAsync(db);
        
        // Optional: Seed sample skills for development/testing
        if (app.Environment.IsDevelopment())
        {
            // You can pass a test user ID here if needed
            // await SkillService.Infrastructure.Data.SkillSeedData.SeedSampleSkillsAsync(db, "test-user-id");
        }
    });
    
    app.Logger.LogInformation("Database migration and skill data seeding completed successfully");
}

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

skills.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = _ => true });

skills.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = r => r.Name == "self" });

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

app.Logger.LogInformation("Starting {ServiceName} with comprehensive skill management capabilities", serviceName);
app.Run();

public partial class Program { }
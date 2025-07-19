using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
//using SkillService.Application.Mappers;
using System.Security.Claims;
using Infrastructure.Models;
using Infrastructure.Services;
using MediatR;
using SkillService;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using System.Text.Json;

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

var userServiceUrl = Environment.GetEnvironmentVariable("USERSERVICE_URL") ?? "http://userservice:5001";
builder.Services.AddHttpClient<IUserLookupService, UserLookupService>(client =>
{
    client.BaseAddress = new Uri(userServiceUrl);
});

builder.Services.AddDbContext<SkillDbContext>(options =>
{
    var connectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING")
        ?? "Host=postgres;Database=skillswap;Username=skillswap;Password=skillswap123;Port=5432;";
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

builder.Services.AddEventSourcing("SkillServiceEventStore");

var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? "localhost:6379";
builder.Services.AddCQRSWithRedis(redisConnectionString, Assembly.GetExecutingAssembly());

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

using var scope = app.Services.CreateScope();
var logger = app.Logger;
var cache = scope.ServiceProvider.GetService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
logger.LogInformation("✅ Cache: {Type}", cache?.GetType().Name);
var db = scope.ServiceProvider.GetRequiredService<SkillDbContext>();
await db.Database.EnsureCreatedAsync();
await SeedData.SeedDefaultDataAsync(db);

#region Skills Endpoints
RouteGroupBuilder skills = app.MapGroup("/skills");

skills.MapGet("/", SearchSkills)
    .WithName("SearchSkills")
    .WithSummary("Search skills")
    .WithDescription("Search and filter skills with pagination")
    .WithTags("Skills")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.SearchSkillsResponse>(StatusCodes.Status200OK);

skills.MapGet("/{id}", GetSkillById)
    .WithName("GetSkillDetails")
    .WithSummary("Get skill details")
    .WithDescription("Get detailed information about a specific skill")
    .WithTags("SkillDetail")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetSkillDetailsResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status400BadRequest);

skills.MapGet("/my-skills", GetUserSkills)
    .WithName("GetUserSkills")
    .WithSummary("Get user skills")
    .WithDescription("Retrieve all skills for a specific user with pagination")
    .WithTags("UserSkills")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetUserSkillsResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

skills.MapPost("/", CreateNewSkill)
    .WithName("CreateSkill")
    .WithSummary("Create a new skill")
    .WithDescription("Create a new skill with the specified details")
    .WithTags("Skills")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.CreateSkillResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization();

skills.MapPut("/{id}", UpdateSkill)
    .WithName("UpdateSkill")
    .WithSummary("Update an existing skill")
    .WithDescription("Update the details of an existing skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.UpdateSkillResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization();

skills.MapDelete("/{id}", DeleteSkill)
    .WithName("DeleteSkill")
    .WithSummary("Delete a skill")
    .WithDescription("Delete a specific skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.DeleteSkillResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

skills.MapPost("/{id}/rate", RateSkill)
    .WithName("RateSkill")
    .WithSummary("Rate a skill")
    .WithDescription("Rate a specific skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.RateSkillResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

skills.MapPost("/{id}/endorse", EndorseSkill)
    .WithName("EndorseSkill")
    .WithSummary("Endorse a skill")
    .WithDescription("Endorse a specific skill by ID")
    .WithTags("Skill")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.EndorseSkillResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization();

static async Task<IResult> SearchSkills(IMediator mediator, ClaimsPrincipal user, [AsParameters] SearchSkillsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new SearchSkillsQuery(
        request.SearchTerm,
        request.CategoryId,
        request.Tags,
        request.ProficiencyLevelId,
        request.IsOffered,
        request.IsWanted,
        request.Location,
        request.IsRemote,
        request.MinRating,
        request.MaxRating,
        request.SortBy,
        request.SortDescending,
        request.PageNumber,
        request.PageSize);

    return await mediator.SendQuery(command);
}

static async Task<IResult> GetSkillById(IMediator mediator, ClaimsPrincipal user, GetSkillDetailsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetSkillDetailsQuery(request.SkillId, request.IncludeReviews, request.IncludeEndorsements);

    return await mediator.SendQuery(query);
}

static async Task<IResult> GetUserSkills(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetUserSkillsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
    
    var query = new GetUserSkillsQuery(request.IsOffering, request.CategoryId, request.IncludeInactive, request.PageNumber, request.PageSize);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateNewSkill(IMediator mediator, ClaimsPrincipal user, CreateSkillRequest request)
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

static async Task<IResult> UpdateSkill(IMediator mediator, ClaimsPrincipal user, UpdateSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
    
    var command = new UpdateSkillCommand(
        request.SkillId,
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

static async Task<IResult> DeleteSkill(IMediator mediator, ClaimsPrincipal user, DeleteSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new DeleteSkillCommand(request.SkillId, request.Reason)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> RateSkill(IMediator mediator, ClaimsPrincipal user, RateSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RateSkillCommand(request.SkillId, request.RatedUserId, request.Rating, request.Comment, request.Tags)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> EndorseSkill(IMediator mediator, ClaimsPrincipal user, EndorseSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new EndorseSkillCommand(request.SkillId, request.EndorsedUserId, request.Comment)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

#endregion

#region Categories Endpoints
RouteGroupBuilder categories = app.MapGroup("/categories");

categories.MapGet("/", GetCategories)
    .WithName("GetSkillCategories")
    .WithSummary("Get skill categories")
    .WithDescription("Retrieve all skill categories with pagination")
    .WithTags("SkillCategories")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetSkillCategoriesResponse>(StatusCodes.Status200OK);

categories.MapPost("/", CreateNewCategory)
    .WithName("CreateSkillCategory")
    .WithSummary("Create a new skill category")
    .WithDescription("Create a new skill category with the specified details")
    .WithTags("SkillCategories")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.CreateSkillCategoryResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization(Policies.RequireAdminRole);

categories.MapPut("/{id}", UpdateCategory)
    .WithName("UpdateSkillCategory")
    .WithSummary("Update an existing skill category")
    .WithDescription("Update an existing skill category with the specified details")
    .WithTags("SkillCategories")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.UpdateSkillCategoryResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .RequireAuthorization(Policies.RequireAdminRole);

static async Task<IResult> GetCategories(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetSkillCategoriesRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetSkillCategoriesQuery(request.IncludeInactive, request.IncludeSkillCounts);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateNewCategory(IMediator mediator, ClaimsPrincipal user, CreateSkillCategoryRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateSkillCategoryCommand(request.Name, request.Description, request.IconName, request.Color, request.SortOrder, request.IsActive)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> UpdateCategory(IMediator mediator, ClaimsPrincipal user, UpdateSkillCategoryRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateSkillCategoryCommand(request.CategoryId, request.Name, request.Description, request.IconName, request.Color, request.SortOrder, request.IsActive)
    {
        UserId = userId
    };  
        
    return await mediator.SendCommand(command);
}
#endregion

#region Proficiency Levels
RouteGroupBuilder levels = app.MapGroup("/proficiency-levels");

levels.MapGet("/", GetProficiencyLevels)
    .WithName("GetProficiencyLevels")
    .WithSummary("Get proficiency levels")
    .WithDescription("Retrieve all proficiency levels with pagination")
    .WithTags("ProficiencyLevels")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetProficiencyLevelsResponse>(StatusCodes.Status200OK);

levels.MapPost("/", CreateNewProficiencyLevel)
    .WithName("CreateProficiencyLevel")
    .WithSummary("Create a new proficiency level")
    .WithDescription("Create a new proficiency level with the specified details")
    .WithTags("ProficiencyLevels")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.CreateProficiencyLevelResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .RequireAuthorization(Policies.RequireAdminRole);

static async Task<IResult> GetProficiencyLevels(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetProficiencyLevelsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetProficiencyLevelsQuery(request.IncludeInactive, request.IncludeSkillCounts);

    return await mediator.SendQuery(query);
}

static async Task<IResult> CreateNewProficiencyLevel(IMediator mediator, ClaimsPrincipal user, CreateProficiencyLevelRequest request)
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
RouteGroupBuilder analytics = app.MapGroup("/analytics");

analytics.MapGet("/statistics", GetSkillStatistics)
    .WithName("GetSkillStatistics")
    .WithSummary("Get skill statistics")
    .WithDescription("Retrieve overall skill statistics including counts, ratings, and endorsements")
    .WithTags("Analytics")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetSkillStatisticsResponse>(StatusCodes.Status200OK);

analytics.MapGet("/popular-tags", GetPopularTags)
    .WithName("GetPopularTags")
    .WithSummary("Get popular tags")
    .WithDescription("Retrieve a list of popular tags based on user interactions")
    .WithTags("Analytics")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetPopularTagsResponse>(StatusCodes.Status200OK);

RouteGroupBuilder rec = app.MapGroup("/recommendations").RequireAuthorization();
rec.MapGet("/", GetSkillRecommendations)
    .WithName("GetSkillRecommendations")
    .WithSummary("Get skill recommendations")
    .WithDescription("Retrieve personalized skill recommendations for the user")
    .WithTags("Recommendations")
    .WithOpenApi()
    .Produces<Contracts.Skill.Responses.GetSkillRecommendationsResponse>(StatusCodes.Status200OK);

app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = _ => true });

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = r => r.Name == "self" });

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

    var query = new GetSkillRecommendationsQuery(request.UserId, request.MaxRecommendations, request.OnlyRemote, request.PreferredLocation);

    return await mediator.SendQuery(query);
}

#endregion

app.Logger.LogInformation("Starting {ServiceName} with comprehensive skill management capabilities", serviceName);
app.Run();

public partial class Program { }
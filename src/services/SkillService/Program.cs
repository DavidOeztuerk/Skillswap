// ============================================================================
// SKILL SERVICE - MODERN CQRS PROGRAM.CS
// src/services/SkillService/Program.cs
// ============================================================================

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
using Contracts.Models;
using Infrastructure.Models;
using Infrastructure.Services;
using Contracts.Users;
using MediatR;
using SkillService;
using SkillService.Domain.Entities;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================

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

// ============================================================================
// SHARED INFRASTRUCTURE SERVICES
// ============================================================================

// Add shared infrastructure (logging, middleware, etc.)
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

var userServiceUrl = Environment.GetEnvironmentVariable("USERSERVICE_URL") ?? "http://userservice:5001";
builder.Services.AddHttpClient<IUserLookupService, UserLookupService>(client =>
{
    client.BaseAddress = new Uri(userServiceUrl);
});

// ============================================================================
// DATABASE SETUP
// ============================================================================

// Configure Entity Framework with InMemory for development
builder.Services.AddDbContext<SkillDbContext>(options =>
{
    options.UseInMemoryDatabase("SkillServiceDb");
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// Event sourcing setup
builder.Services.AddEventSourcing("SkillServiceEventStore");

// ============================================================================
// CQRS & MEDIATR SETUP
// ============================================================================

var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? "localhost:6379"; // Default Redis connection string
builder.Services.AddCQRSWithRedis(redisConnectionString, Assembly.GetExecutingAssembly());

// ============================================================================
// MESSAGE BUS SETUP (MassTransit + RabbitMQ)
// ============================================================================

builder.Services.AddMassTransit(x =>
{
    // No consumers needed for SkillService currently
    // It only publishes events, doesn't consume them

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// ============================================================================
// JWT & AUTHENTICATION SETUP
// ============================================================================

// Configure JWT settings
builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = secret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.ExpireMinutes = 60;
});

// Configure JWT authentication
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

// ============================================================================
// AUTHORIZATION SETUP
// ============================================================================

// Add SkillSwap authorization policies
builder.Services.AddSkillSwapAuthorization();

// ============================================================================
// RATE LIMITING SETUP
// ============================================================================

// Configure rate limiting
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));
builder.Services.AddMemoryCache();

// ============================================================================
// API DOCUMENTATION
// ============================================================================

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

// ============================================================================
// BUILD APPLICATION
// ============================================================================

var app = builder.Build();

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================

// Use shared infrastructure middleware
app.UseSharedInfrastructure();

// Rate limiting
app.UseMiddleware<RateLimitingMiddleware>();

// Development-specific middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkillService API v1");
        c.RoutePrefix = string.Empty;
    });
}

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

// using (var scope = app.Services.CreateScope())
// {
//     var cache = scope.ServiceProvider.GetService<IDistributedCache>();
//     app.Logger.LogInformation("✅ Cache Type: {CacheType}", cache?.GetType().Name);

//     var context = scope.ServiceProvider.GetRequiredService<SkillDbContext>();

//     try
//     {
//         await context.Database.EnsureCreatedAsync();

//         // Seed default data
//         await SeedDefaultDataAsync(context);

//         app.Logger.LogInformation("SkillService database initialized successfully");
//     }
//     catch (Exception ex)
//     {
//         app.Logger.LogError(ex, "Error occurred while initializing SkillService database");
//     }
// }

// ============================================================================
// API ENDPOINTS - SKILL MANAGEMENT
// ============================================================================

// app.MapPost("/skills", async (IMediator mediator, HttpContext context, CreateSkillCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     command.UserId = userId;
//     return await mediator.SendCommand(command);
// })
// .WithName("CreateSkill")
// .WithSummary("Create a new skill")
// .WithDescription("Creates a new skill for the authenticated user")
// .WithTags("Skills")
// .RequireAuthorization()
// .Produces<CreateSkillResponse>(201)
// .Produces(400);

// app.MapPut("/skills/{skillId}", async (IMediator mediator, HttpContext context, string skillId, UpdateSkillCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedCommand = command with { SkillId = skillId, UserId = userId };
//     return await mediator.SendCommand(updatedCommand);
// })
// .WithName("UpdateSkill")
// .WithSummary("Update a skill")
// .WithDescription("Updates an existing skill owned by the authenticated user")
// .WithTags("Skills")
// .RequireAuthorization()
// .Produces<UpdateSkillResponse>(200)
// .Produces(400)
// .Produces(404);

// app.MapDelete("/skills/{skillId}", async (IMediator mediator, HttpContext context, string skillId, string? reason = null) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var command = new DeleteSkillCommand(skillId, reason) { UserId = userId };
//     return await mediator.SendCommand(command);
// })
// .WithName("DeleteSkill")
// .WithSummary("Delete a skill")
// .WithDescription("Deletes a skill owned by the authenticated user")
// .WithTags("Skills")
// .RequireAuthorization()
// .Produces<DeleteSkillResponse>(200)
// .Produces(404);

// // ============================================================================
// // API ENDPOINTS - SKILL QUERIES
// // ============================================================================

// app.MapGet("/skills", async (IMediator mediator, [AsParameters] SearchSkillsQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("SearchSkills")
// .WithSummary("Search skills")
// .WithDescription("Search and filter skills with pagination")
// .WithTags("Skills")
// .Produces<PagedResponse<SkillSearchResultResponse>>(200);

// app.MapGet("/skills/{skillId}", async (IMediator mediator, string skillId, bool includeReviews = false, bool includeEndorsements = false) =>
// {
//     var query = new GetSkillDetailsQuery(skillId, includeReviews, includeEndorsements);
//     return await mediator.SendQuery(query);
// })
// .WithName("GetSkillDetails")
// .WithSummary("Get skill details")
// .WithDescription("Get detailed information about a specific skill")
// .WithTags("Skills")
// .Produces<SkillDetailsResponse>(200)
// .Produces(404);

// app.MapGet("/users/{userId}/skills", async (IMediator mediator, string userId, [AsParameters] GetUserSkillsQuery query) =>
// {
//     var updatedQuery = query with { UserId = userId };
//     return await mediator.SendQuery(updatedQuery);
// })
// .WithName("GetUserSkills")
// .WithSummary("Get user skills")
// .WithDescription("Get all skills for a specific user")
// .WithTags("Skills")
// .Produces<PagedResponse<UserSkillResponse>>(200);

// app.MapGet("/my/skills", async (IMediator mediator, HttpContext context, [AsParameters] GetUserSkillsQuery query) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedQuery = query with { UserId = userId };
//     return await mediator.SendQuery(updatedQuery);
// })
// .WithName("GetMySkills")
// .WithSummary("Get my skills")
// .WithDescription("Get all skills for the authenticated user")
// .WithTags("Skills")
// .RequireAuthorization()
// .Produces<PagedResponse<UserSkillResponse>>(200);

// // ============================================================================
// // API ENDPOINTS - SKILL INTERACTIONS
// // ============================================================================

// app.MapPost("/skills/{skillId}/rate", async (IMediator mediator, HttpContext context, string skillId, RateSkillCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedCommand = command with { SkillId = skillId, UserId = userId };
//     return await mediator.SendCommand(updatedCommand);
// })
// .WithName("RateSkill")
// .WithSummary("Rate a skill")
// .WithDescription("Rate and review a skill")
// .WithTags("Skills")
// .RequireAuthorization()
// .Produces<RateSkillResponse>(200)
// .Produces(400);

// app.MapPost("/skills/{skillId}/endorse", async (IMediator mediator, HttpContext context, string skillId, EndorseSkillCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedCommand = command with { SkillId = skillId, UserId = userId };
//     return await mediator.SendCommand(updatedCommand);
// })
// .WithName("EndorseSkill")
// .WithSummary("Endorse a skill")
// .WithDescription("Endorse a skill with an optional message")
// .WithTags("Skills")
// .RequireAuthorization()
// .Produces<EndorseSkillResponse>(200)
// .Produces(400);

// // ============================================================================
// // API ENDPOINTS - SKILL CATEGORIES
// // ============================================================================

// app.MapGet("/categories", async (IMediator mediator, [AsParameters] GetSkillCategoriesQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("GetSkillCategories")
// .WithSummary("Get skill categories")
// .WithDescription("Get all skill categories")
// .WithTags("Categories")
// .Produces<List<SkillCategoryResponse>>(200);

// app.MapPost("/categories", async (IMediator mediator, HttpContext context, CreateSkillCategoryCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     command.UserId = userId;
//     return await mediator.SendCommand(command);
// })
// .WithName("CreateSkillCategory")
// .WithSummary("Create skill category (Admin)")
// .WithDescription("Create a new skill category - Admin access required")
// .WithTags("Categories")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<CreateSkillCategoryResponse>(201)
// .Produces(400);

// app.MapPut("/categories/{categoryId}", async (IMediator mediator, HttpContext context, string categoryId, UpdateSkillCategoryCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedCommand = command with { CategoryId = categoryId, UserId = userId };
//     return await mediator.SendCommand(updatedCommand);
// })
// .WithName("UpdateSkillCategory")
// .WithSummary("Update skill category (Admin)")
// .WithDescription("Update an existing skill category - Admin access required")
// .WithTags("Categories")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<UpdateSkillCategoryResponse>(200)
// .Produces(400)
// .Produces(404);

// // ============================================================================
// // API ENDPOINTS - PROFICIENCY LEVELS
// // ============================================================================

// app.MapGet("/proficiency-levels", async (IMediator mediator, [AsParameters] GetProficiencyLevelsQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("GetProficiencyLevels")
// .WithSummary("Get proficiency levels")
// .WithDescription("Get all proficiency levels")
// .WithTags("ProficiencyLevels")
// .Produces<List<ProficiencyLevelResponse>>(200);

// app.MapPost("/proficiency-levels", async (IMediator mediator, HttpContext context, CreateProficiencyLevelCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     command.UserId = userId;
//     return await mediator.SendCommand(command);
// })
// .WithName("CreateProficiencyLevel")
// .WithSummary("Create proficiency level (Admin)")
// .WithDescription("Create a new proficiency level - Admin access required")
// .WithTags("ProficiencyLevels")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<CreateProficiencyLevelResponse>(201)
// .Produces(400);

// // ============================================================================
// // API ENDPOINTS - ANALYTICS & DISCOVERY
// // ============================================================================

// app.MapGet("/analytics/statistics", async (IMediator mediator, [AsParameters] GetSkillStatisticsQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("GetSkillStatistics")
// .WithSummary("Get skill statistics")
// .WithDescription("Get comprehensive skill statistics and analytics")
// .WithTags("Analytics")
// .Produces<SkillStatisticsResponse>(200);

// app.MapGet("/analytics/popular-tags", async (IMediator mediator, [AsParameters] GetPopularTagsQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("GetPopularTags")
// .WithSummary("Get popular tags")
// .WithDescription("Get popular skill tags with usage statistics")
// .WithTags("Analytics")
// .Produces<List<PopularTagResponse>>(200);

// app.MapGet("/recommendations", async (IMediator mediator, HttpContext context, [AsParameters] GetSkillRecommendationsQuery query) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedQuery = query with { UserId = userId };
//     return await mediator.SendQuery(updatedQuery);
// })
// .WithName("GetSkillRecommendations")
// .WithSummary("Get skill recommendations")
// .WithDescription("Get personalized skill recommendations for the authenticated user")
// .WithTags("Discovery")
// .RequireAuthorization()
// .Produces<List<SkillRecommendationResponse>>(200);

// // ============================================================================
// // HEALTH CHECK ENDPOINTS
// // ============================================================================

// app.MapGet("/health/ready", async (SkillDbContext dbContext) =>
// {
//     try
//     {
//         // Check database connectivity
//         await dbContext.Database.CanConnectAsync();

//         return Results.Ok(new { 
//             status = "ready", 
//             timestamp = DateTime.UtcNow,
//             services = new {
//                 database = "healthy",
//                 messaging = "healthy"
//             }
//         });
//     }
//     catch (Exception ex)
//     {
//         return Results.Problem($"Health check failed: {ex.Message}");
//     }
// })
// .WithName("HealthReady")
// .WithSummary("Readiness check")
// .WithTags("Health");

// app.MapGet("/health/live", () =>
// {
//     return Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow });
// })
// .WithName("HealthLive")
// .WithSummary("Liveness check")
// .WithTags("Health");

// endpoint groups
var skills = app.MapGroup("/skills").RequireAuthorization();
skills.MapPost("/", async (IMediator m, HttpContext ctx, CreateSkillCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { UserId = uid });
}).WithName("CreateSkill");
skills.MapPut("/{id}", async (IMediator m, HttpContext ctx, string id, UpdateSkillCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { SkillId = id, UserId = uid });
}).WithName("UpdateSkill");
skills.MapDelete("/{id}", async (IMediator m, HttpContext ctx, string id, string? reason) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(new DeleteSkillCommand(id, reason) { UserId = uid });
}).WithName("DeleteSkill");
skills.MapGet("/", async (IMediator m, [AsParameters] SearchSkillsQuery q) => await m.SendQuery(q)).WithName("SearchSkills");
skills.MapGet("/{id}", async (IMediator m, string id, bool rev = false, bool end = false)
    => await m.SendQuery(new GetSkillDetailsQuery(id, rev, end))).WithName("GetSkillDetails");
skills.MapPost("/{id}/rate", async (IMediator m, HttpContext ctx, string id, RateSkillCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { SkillId = id, UserId = uid });
}).WithName("RateSkill");
skills.MapPost("/{id}/endorse", async (IMediator m, HttpContext ctx, string id, EndorseSkillCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { SkillId = id, UserId = uid });
}).WithName("EndorseSkill");

var userskills = app.MapGroup("/users/{userId}/skills");
userskills.MapGet("/", async (IMediator m, string userId, [AsParameters] GetUserSkillsQuery q)
    => await m.SendQuery(q with { UserId = userId })).WithName("GetUserSkills");
var mine = app.MapGroup("/my/skills").RequireAuthorization();
mine.MapGet("/", async (IMediator m, HttpContext ctx, [AsParameters] GetUserSkillsQuery q) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendQuery(q with { UserId = uid });
}).WithName("GetMySkills");

var categories = app.MapGroup("/categories");
categories.MapGet("/", async (IMediator m, [AsParameters] GetSkillCategoriesQuery q) => await m.SendQuery(q)).WithName("GetSkillCategories");
categories.MapPost("/", async (IMediator m, HttpContext ctx, CreateSkillCategoryCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { UserId = uid });
}).RequireAuthorization(Policies.RequireAdminRole).WithName("CreateSkillCategory");
categories.MapPut("/{id}", async (IMediator m, HttpContext ctx, string id, UpdateSkillCategoryCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { CategoryId = id, UserId = uid });
}).RequireAuthorization(Policies.RequireAdminRole).WithName("UpdateSkillCategory");

var levels = app.MapGroup("/proficiency-levels");
levels.MapGet("/", async (IMediator m, [AsParameters] GetProficiencyLevelsQuery q) => await m.SendQuery(q)).WithName("GetProficiencyLevels");
levels.MapPost("/", async (IMediator m, HttpContext ctx, CreateProficiencyLevelCommand cmd) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { UserId = uid });
}).RequireAuthorization(Policies.RequireAdminRole).WithName("CreateProficiencyLevel");

var analytics = app.MapGroup("/analytics");
analytics.MapGet("/statistics", async (IMediator m, [AsParameters] GetSkillStatisticsQuery q) => await m.SendQuery(q)).WithName("GetSkillStatistics");
analytics.MapGet("/popular-tags", async (IMediator m, [AsParameters] GetPopularTagsQuery q) => await m.SendQuery(q)).WithName("GetPopularTags");

var rec = app.MapGroup("/recommendations").RequireAuthorization();
rec.MapGet("/", async (IMediator m, HttpContext ctx, [AsParameters] GetSkillRecommendationsQuery q) =>
{
    var uid = ctx.User.FindFirst("user_id")?.Value;
    return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendQuery(q with { UserId = uid });
}).WithName("GetSkillRecommendations");

app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = _ => true });
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = r => r.Name == "self" });

// init + seed
using var scope = app.Services.CreateScope();
var logger = app.Logger;
var cache = scope.ServiceProvider.GetService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
logger.LogInformation("✅ Cache: {Type}", cache?.GetType().Name);
var db = scope.ServiceProvider.GetRequiredService<SkillDbContext>();
await db.Database.EnsureCreatedAsync();
await SeedDefaultDataAsync(db);




// ============================================================================
// HELPER METHODS
// ============================================================================

// ============================================================================
// RUN APPLICATION
// ============================================================================



// using System.Reflection;
// using System.Text;
// using MassTransit;
// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.IdentityModel.Tokens;
// using Microsoft.AspNetCore.Diagnostics.HealthChecks;
// using Infrastructure.Extensions;
// using EventSourcing;
// using Infrastructure.Security;
// using Infrastructure.Middleware;
// using CQRS.Extensions;
// using SkillService.Application.Commands;
// using SkillService.Application.Queries;
// using Contracts.Models;
// using Infrastructure.Models;
// using Infrastructure.Services;
// using Contracts.Users;
// using MediatR;
// using SkillService;
// using SkillService.Domain.Entities;
// using Microsoft.Extensions.DependencyInjection;

// var builder = WebApplication.CreateBuilder(args);
// var serviceName = "SkillService";
// var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";

// // shared infra, EF, event sourcing
// builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);
// builder.Services.AddHttpClient<IUserLookupService, UserLookupService>(c =>
//     c.BaseAddress = new Uri(Environment.GetEnvironmentVariable("USERSERVICE_URL") ?? "http://userservice:5001"));
// builder.Services.AddDbContext<SkillDbContext>(opts =>
// {
//     opts.UseInMemoryDatabase("SkillServiceDb");
//     if (builder.Environment.IsDevelopment())
//     {
//         opts.EnableSensitiveDataLogging();
//         opts.EnableDetailedErrors();
//     }
// });
// builder.Services.AddEventSourcing("SkillServiceEventStore");

// // CQRS + Redis
// var redis = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
//            ?? builder.Configuration.GetConnectionString("Redis")
//            ?? "localhost:6379";
// builder.Services.AddStackExchangeRedisCache(o => o.Configuration = redis);
// builder.Services.AddCQRSWithRedis(redis, Assembly.GetExecutingAssembly());

// // MassTransit
// builder.Services.AddMassTransit(x =>
// {
//     x.UsingRabbitMq((ctx, cfg) =>
//     {
//         cfg.Host(rabbitHost, "/", h =>
//         {
//             h.Username("guest"); h.Password("guest");
//         });
//     });
// });

// // JWT/Auth
// builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(opts =>
//     {
//         var jwt = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
//         opts.RequireHttpsMetadata = false;
//         opts.SaveToken = true;
//         opts.TokenValidationParameters = new TokenValidationParameters
//         {
//             ValidateIssuer = true,
//             ValidateAudience = true,
//             ValidateIssuerSigningKey = true,
//             ValidateLifetime = true,
//             ValidIssuer = jwt.Issuer,
//             ValidAudience = jwt.Audience,
//             IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
//             ClockSkew = TimeSpan.Zero
//         };
//     });
// builder.Services.AddSkillSwapAuthorization();

// // rate limiting, swagger, healthchecks
// builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));
// builder.Services.AddMemoryCache();
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen(c =>
// {
//     c.SwaggerDoc("v1", new() { Title = "SkillService API", Version = "v1" });
//     c.AddSecurityDefinition("Bearer", new()
//     {
//         Description = "Bearer {token}",
//         Name = "Authorization",
//         In = Microsoft.OpenApi.Models.ParameterLocation.Header,
//         Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
//         Scheme = "Bearer"
//     });
//     c.AddSecurityRequirement(new() {
//         {
//             new() {
//                 Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
//             }, Array.Empty<string>()
//         }
//     });
// });
// builder.Services.AddHealthChecks()
//     .AddDbContextCheck<SkillDbContext>("database");
//     // .AddRabbitMQ($"amqp://guest:guest@{rabbitHost}/");

// var app = builder.Build();

// // global error handler, middleware
// app.UseExceptionHandler(a => a.Run(async ctx =>
// {
//     var ex = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
//     ctx.Response.StatusCode = 500;
//     await ctx.Response.WriteAsJsonAsync(new { error = ex?.Message });
// }));
// app.UseSharedInfrastructure();
// app.UseAuthentication();
// app.UseAuthorization();
// app.UseMiddleware<RateLimitingMiddleware>();

// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

// // endpoint groups
// var skills = app.MapGroup("/skills").RequireAuthorization();
// skills.MapPost("/", async (IMediator m, HttpContext ctx, CreateSkillCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { UserId = uid });
// }).WithName("CreateSkill");
// skills.MapPut("/{id}", async (IMediator m, HttpContext ctx, string id, UpdateSkillCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { SkillId = id, UserId = uid });
// }).WithName("UpdateSkill");
// skills.MapDelete("/{id}", async (IMediator m, HttpContext ctx, string id, string? reason) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(new DeleteSkillCommand(id, reason) { UserId = uid });
// }).WithName("DeleteSkill");
// skills.MapGet("/", async (IMediator m, [AsParameters] SearchSkillsQuery q) => await m.SendQuery(q)).WithName("SearchSkills");
// skills.MapGet("/{id}", async (IMediator m, string id, bool rev = false, bool end = false)
//     => await m.SendQuery(new GetSkillDetailsQuery(id, rev, end))).WithName("GetSkillDetails");
// skills.MapPost("/{id}/rate", async (IMediator m, HttpContext ctx, string id, RateSkillCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { SkillId = id, UserId = uid });
// }).WithName("RateSkill");
// skills.MapPost("/{id}/endorse", async (IMediator m, HttpContext ctx, string id, EndorseSkillCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { SkillId = id, UserId = uid });
// }).WithName("EndorseSkill");

// var userskills = app.MapGroup("/users/{userId}/skills");
// userskills.MapGet("/", async (IMediator m, string userId, [AsParameters] GetUserSkillsQuery q)
//     => await m.SendQuery(q with { UserId = userId })).WithName("GetUserSkills");
// var mine = app.MapGroup("/my/skills").RequireAuthorization();
// mine.MapGet("/", async (IMediator m, HttpContext ctx, [AsParameters] GetUserSkillsQuery q) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendQuery(q with { UserId = uid });
// }).WithName("GetMySkills");

// var categories = app.MapGroup("/categories");
// categories.MapGet("/", async (IMediator m, [AsParameters] GetSkillCategoriesQuery q) => await m.SendQuery(q)).WithName("GetSkillCategories");
// categories.MapPost("/", async (IMediator m, HttpContext ctx, CreateSkillCategoryCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { UserId = uid });
// }).RequireAuthorization(Policies.RequireAdminRole).WithName("CreateSkillCategory");
// categories.MapPut("/{id}", async (IMediator m, HttpContext ctx, string id, UpdateSkillCategoryCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { CategoryId = id, UserId = uid });
// }).RequireAuthorization(Policies.RequireAdminRole).WithName("UpdateSkillCategory");

// var levels = app.MapGroup("/proficiency-levels");
// levels.MapGet("/", async (IMediator m, [AsParameters] GetProficiencyLevelsQuery q) => await m.SendQuery(q)).WithName("GetProficiencyLevels");
// levels.MapPost("/", async (IMediator m, HttpContext ctx, CreateProficiencyLevelCommand cmd) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendCommand(cmd with { UserId = uid });
// }).RequireAuthorization(Policies.RequireAdminRole).WithName("CreateProficiencyLevel");

// var analytics = app.MapGroup("/analytics");
// analytics.MapGet("/statistics", async (IMediator m, [AsParameters] GetSkillStatisticsQuery q) => await m.SendQuery(q)).WithName("GetSkillStatistics");
// analytics.MapGet("/popular-tags", async (IMediator m, [AsParameters] GetPopularTagsQuery q) => await m.SendQuery(q)).WithName("GetPopularTags");

// var rec = app.MapGroup("/recommendations").RequireAuthorization();
// rec.MapGet("/", async (IMediator m, HttpContext ctx, [AsParameters] GetSkillRecommendationsQuery q) =>
// {
//     var uid = ctx.User.FindFirst("user_id")?.Value;
//     return string.IsNullOrEmpty(uid) ? Results.Unauthorized() : await m.SendQuery(q with { UserId = uid });
// }).WithName("GetSkillRecommendations");

// app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = _ => true });
// app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = r => r.Name == "self" });

// // init + seed
// using var scope = app.Services.CreateScope();
// var logger = app.Logger;
// var cache = scope.ServiceProvider.GetService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
// logger.LogInformation("✅ Cache: {Type}", cache?.GetType().Name);
// var db = scope.ServiceProvider.GetRequiredService<SkillDbContext>();
// await db.Database.EnsureCreatedAsync();
// await SeedDefaultDataAsync(db);

// static string? ExtractUserIdFromContext(HttpContext context)
// {
//     return context.User.FindFirst("user_id")?.Value
//            ?? context.User.FindFirst("sub")?.Value
//            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
// }

static async Task SeedDefaultDataAsync(SkillDbContext context)
{
    // Seed default skill categories if they don't exist
    if (!await context.SkillCategories.AnyAsync())
    {
        var defaultCategories = new[]
        {
            new SkillCategory
            {
                Name = "Programming",
                Description = "Software development and programming languages",
                IconName = "code",
                Color = "#007bff",
                SortOrder = 1,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Design",
                Description = "Graphic design, UI/UX, and creative skills",
                IconName = "palette",
                Color = "#dc3545",
                SortOrder = 2,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Marketing",
                Description = "Digital marketing, SEO, and social media",
                IconName = "megaphone",
                Color = "#28a745",
                SortOrder = 3,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Business",
                Description = "Business strategy, management, and entrepreneurship",
                IconName = "briefcase",
                Color = "#ffc107",
                SortOrder = 4,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Languages",
                Description = "Foreign languages and communication",
                IconName = "globe",
                Color = "#17a2b8",
                SortOrder = 5,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Music",
                Description = "Musical instruments and music production",
                IconName = "music",
                Color = "#6f42c1",
                SortOrder = 6,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Sports & Fitness",
                Description = "Physical activities and fitness training",
                IconName = "heart",
                Color = "#fd7e14",
                SortOrder = 7,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Cooking",
                Description = "Culinary arts and cooking techniques",
                IconName = "chef-hat",
                Color = "#20c997",
                SortOrder = 8,
                IsActive = true,
                CreatedBy = "system"
            }
        };

        context.SkillCategories.AddRange(defaultCategories);
    }

    // Seed default proficiency levels if they don't exist
    if (!await context.ProficiencyLevels.AnyAsync())
    {
        var defaultLevels = new[]
        {
            new ProficiencyLevel
            {
                Level = "Beginner",
                Description = "Just starting out, basic knowledge",
                Rank = 1,
                Color = "#28a745",
                IsActive = true,
                MinExperienceMonths = 0,
                MaxExperienceMonths = 6,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Intermediate",
                Description = "Some experience, comfortable with basics",
                Rank = 2,
                Color = "#ffc107",
                IsActive = true,
                MinExperienceMonths = 6,
                MaxExperienceMonths = 24,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Advanced",
                Description = "Significant experience, can teach others",
                Rank = 3,
                Color = "#fd7e14",
                IsActive = true,
                MinExperienceMonths = 24,
                MaxExperienceMonths = 60,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Expert",
                Description = "Professional level, extensive experience",
                Rank = 4,
                Color = "#dc3545",
                IsActive = true,
                MinExperienceMonths = 60,
                MaxExperienceMonths = null,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Master",
                Description = "Industry expert, thought leader",
                Rank = 5,
                Color = "#6f42c1",
                IsActive = true,
                MinExperienceMonths = 120,
                MaxExperienceMonths = null,
                RequiredSkillCount = 5,
                CreatedBy = "system"
            }
        };

        context.ProficiencyLevels.AddRange(defaultLevels);
    }

    await context.SaveChangesAsync();
}


app.Logger.LogInformation("Starting {ServiceName} with comprehensive skill management capabilities", serviceName);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { } // SKILL SERVICE - MODERN CQRS PROGRAM.CS
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using CQRS.Extensions;
using EventSourcing;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Middleware;
using Infrastructure.Models;
using Infrastructure.Security;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using UserService.Api.Extensions;
using UserService.Infrastructure.Data;
using UserService.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================

var serviceName = "UserService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST")
    ?? builder.Configuration["RabbitMQ:Host"]
    ?? "localhost";

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
// SHARED INFRASTRUCTURE SERVICES
// ============================================================================

// Add shared infrastructure (logging, middleware, etc.)
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

// Add UserService Infrastructure (Repository registration)
builder.Services.AddInfrastructure();

// Configure HttpClient for SkillService communication
builder.Services.AddHttpClient("SkillService", client =>
{
    var skillServiceUrl = Environment.GetEnvironmentVariable("SKILLSERVICE_URL")
        ?? builder.Configuration["Services:SkillService:Url"]
        ?? "http://skillservice:5002";

    client.BaseAddress = new Uri(skillServiceUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ============================================================================
// DATABASE SETUP
// ============================================================================

// Configure Entity Framework with PostgreSQL
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

builder.Services.AddDbContext<UserDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg => npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null))
        .EnableDetailedErrors(builder.Environment.IsDevelopment())
        .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event sourcing setup
builder.Services.AddEventSourcing("UserServiceEventStore");

// ============================================================================
// CQRS & MEDIATR SETUP
// ============================================================================

// Add CQRS with caching support
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"] ?? throw new InvalidOperationException("Redis connection string not configured");

var applicationAssembly = Assembly.Load("UserService.Application");

System.Console.WriteLine(applicationAssembly);

builder.Services
    .AddCaching(redisConnectionString)
    .AddCQRS(applicationAssembly);

// ============================================================================
// MESSAGE BUS SETUP (MassTransit + RabbitMQ)
// ============================================================================

builder.Services.AddMassTransit(x =>
{
    // Register all consumers from current assembly
    x.AddConsumers(Assembly.GetExecutingAssembly());

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        // Configure endpoints for domain event handlers
        cfg.ConfigureEndpoints(context);
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
    options.ExpireMinutes = expireMinutes;
});


// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;

        // Behalte Original-Claimnamen (kein automatisches Remapping):
        opts.MapInboundClaims = false; // .NET 7/8; für .NET 6: JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

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

            // WICHTIG: passend zu deinem Token:
            NameClaimType = JwtRegisteredClaimNames.Sub, // wenn deine UserId in "sub" steckt
            RoleClaimType = ClaimTypes.Role               // du emitierst ClaimTypes.Role (und zusätzlich "role")
        };

        // Add custom token validation events
        opts.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers.Append("Token-Expired", "true");
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = System.Text.Json.JsonSerializer.Serialize(new
                {
                    error = "unauthorized",
                    message = "You are not authorized to access this resource"
                });
                return context.Response.WriteAsync(result);
            }
        };
    });

// ============================================================================
// AUTHORIZATION SETUP
// ============================================================================

// Add SkillSwap authorization policies
builder.Services.AddSkillSwapAuthorization();

// Add permission-based authorization
builder.Services.AddPermissionAuthorization();
builder.Services.AddAuthorization(options =>
{
    options.AddPermissionPolicies();
});

// ============================================================================
// RATE LIMITING SETUP
// ============================================================================

// Configure rate limiting
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));

// ============================================================================
// API DOCUMENTATION
// ============================================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SkillSwap UserService API",
        Version = "v1",
        Description = "Advanced UserService with CQRS, Event Sourcing, and comprehensive security"
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

// ============================================================================
// BUILD APPLICATION
// ============================================================================

var app = builder.Build();

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    // Execute migrations with retry strategy
    await strategy.ExecuteAsync(async () =>
    {
        // EnsureCreated erstellt die Datenbank falls sie nicht existiert
        // aber verwendet KEINE Migrations. Für Production besser Datenbank manuell erstellen.
        // await db.Database.EnsureCreatedAsync();
        
        // MigrateAsync erstellt auch die Datenbank und wendet Migrations an
        await db.Database.MigrateAsync();
    });

    // Execute seeding with retry strategy AND transaction
    await strategy.ExecuteAsync(async () =>
    {
        using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            await RbacSeedData.SeedAsync(db);
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    });

    app.Logger.LogInformation("Database migration and seeding completed successfully");
}

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================

// Use shared infrastructure middleware (security headers, logging, etc.)
app.UseSharedInfrastructure();

// Rate limiting (after shared infrastructure)
app.UseMiddleware<RateLimitingMiddleware>();

// Development-specific middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "UserService API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Permission middleware (after authentication/authorization)
app.UsePermissionMiddleware();

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

// Initialize database with seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<UserDbContext>();

    try
    {
        // Ensure database is created (for InMemory provider)
        // await context.Database.EnsureCreatedAsync();

        app.Logger.LogInformation("Database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing database");
    }
}

// ============================================================================
// CONTROLLER ENDPOINTS
// ============================================================================

app.MapAuthController();
app.MapUserVerificationController();
app.MapUserProfileController();
app.MapUserSkillsController();
app.MapUserBlockingController();
app.MapUserManagementController();
app.MapTwoFactorController();
app.MapPermissionController();
app.MapAdminEndpoints();

// ============================================================================
// HEALTH CHECKS AND UTILITY ENDPOINTS
// ============================================================================

var health = app.MapGroup("/health");
health.MapGet("/ready", () => Results.Ok(new { Status = "Ready", Timestamp = DateTime.UtcNow }))
    .WithName("HealthReady")
    .WithSummary("Readiness check")
    .WithTags("Health");

health.MapGet("/live", () => Results.Ok(new { Status = "Alive", Timestamp = DateTime.UtcNow }))
    .WithName("HealthLive")
    .WithSummary("Liveness check")
    .WithTags("Health");

var events = app.MapGroup("/events");
events.MapPost("/replay", ([FromBody] EventReplayService request) =>
    Results.Ok(new { Message = "Event replay initiated", }))
    .WithName("ReplayEvents")
    .WithSummary("Replay domain events")
    .WithTags("Events");

// ============================================================================
// DATABASE MIGRATION & SEEDING
// ============================================================================
// Already handled above after app.Build() - removed duplicate

// ============================================================================
// START APPLICATION
// ============================================================================

app.Logger.LogInformation("Starting {ServiceName}", serviceName);
app.Logger.LogInformation("JWT Configuration: Issuer={Issuer}, Audience={Audience}, Expiry={Expiry}min",
    issuer, audience, expireMinutes);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
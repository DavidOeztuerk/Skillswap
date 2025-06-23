using System.Reflection;
using System.Text;
using MassTransit;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Infrastructure.Extensions;
using Infrastructure.Security;
using Infrastructure.Middleware;
using CQRS.Extensions;
using UserService.Application.Commands;
using UserService.Application.Queries;
using Contracts.Models;
using UserService;
using Infrastructure.Models;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================

var serviceName = "UserService";
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

var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE")
    ?? builder.Configuration["JwtSettings:ExpireMinutes"]
    ?? "60";

var expireMinutes = int.TryParse(expireString, out var tmp) ? tmp : 60;

// ============================================================================
// SHARED INFRASTRUCTURE SERVICES
// ============================================================================

// Add shared infrastructure (logging, middleware, etc.)
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

// ============================================================================
// DATABASE SETUP
// ============================================================================

// Configure Entity Framework with InMemory for development
builder.Services.AddDbContext<UserDbContext>(options =>
{
    options.UseInMemoryDatabase("UserServiceDb");
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// ============================================================================
// CQRS & MEDIATR SETUP
// ============================================================================

// Add CQRS with caching support
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

// Register enhanced JWT service
builder.Services.AddScoped<IEnhancedJwtService, EnhancedJwtService>();
builder.Services.AddSingleton<ITotpService, TotpService>();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false; // For development only
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
            ClockSkew = TimeSpan.Zero // No clock skew tolerance
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

// ============================================================================
// RATE LIMITING SETUP
// ============================================================================

// Configure rate limiting
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));
builder.Services.AddMemoryCache(); // Required for rate limiting

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
        await context.Database.EnsureCreatedAsync();

        app.Logger.LogInformation("Database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing database");
    }
}

// ============================================================================
// API ENDPOINTS - AUTHENTICATION
// ============================================================================

app.MapPost("/register", async (IMediator mediator, RegisterUserCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("RegisterUser")
.WithSummary("Register a new user")
.WithDescription("Creates a new user account with email verification")
.WithTags("Authentication")
.Produces<RegisterUserResponse>(201)
.Produces(400);

app.MapPost("/login", async (IMediator mediator, LoginUserCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("LoginUser")
.WithSummary("Authenticate user")
.WithDescription("Authenticates user credentials and returns JWT tokens")
.WithTags("Authentication")
.Produces<LoginUserResponse>(200)
.Produces(401);

app.MapPost("/refresh-token", async (IMediator mediator, RefreshTokenCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("RefreshToken")
.WithSummary("Refresh access token")
.WithDescription("Refreshes an expired access token using a valid refresh token")
.WithTags("Authentication")
.Produces<RefreshTokenResponse>(200)
.Produces(400);

app.MapPost("/verify-email", async (IMediator mediator, VerifyEmailCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("VerifyEmail")
.WithSummary("Verify email address")
.WithDescription("Verifies user's email address using verification token")
.WithTags("Authentication")
.Produces<VerifyEmailResponse>(200)
.Produces(400);

app.MapPost("/2fa/generate", async (IMediator mediator, HttpContext context) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var cmd = new GenerateTwoFactorSecretCommand(userId);
    return await mediator.SendCommand(cmd);
})
.WithName("GenerateTwoFactorSecret")
.WithSummary("Generate 2FA secret")
.WithDescription("Generates a secret key for two-factor authentication")
.WithTags("Authentication")
.RequireAuthorization()
.Produces<GenerateTwoFactorSecretResponse>(200);

app.MapPost("/2fa/verify", async (IMediator mediator, HttpContext context, VerifyTwoFactorCodeCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updated = command with { UserId = userId };
    return await mediator.SendCommand(updated);
})
.WithName("VerifyTwoFactorCode")
.WithSummary("Verify 2FA code")
.WithDescription("Verifies a TOTP code and enables two-factor authentication")
.WithTags("Authentication")
.RequireAuthorization()
.Produces<VerifyTwoFactorCodeResponse>(200)
.Produces(400);

// ============================================================================
// API ENDPOINTS - PASSWORD MANAGEMENT
// ============================================================================

app.MapPost("/request-password-reset", async (IMediator mediator, RequestPasswordResetCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("RequestPasswordReset")
.WithSummary("Request password reset")
.WithDescription("Sends password reset email to user")
.WithTags("Password Management")
.Produces<RequestPasswordResetResponse>(200);

app.MapPost("/reset-password", async (IMediator mediator, ResetPasswordCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("ResetPassword")
.WithSummary("Reset password")
.WithDescription("Resets user password using reset token")
.WithTags("Password Management")
.Produces<ResetPasswordResponse>(200)
.Produces(400);

app.MapPost("/change-password", async (IMediator mediator, ChangePasswordCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("ChangePassword")
.WithSummary("Change password")
.WithDescription("Changes user password (requires authentication)")
.WithTags("Password Management")
.RequireAuthorization()
.Produces<ChangePasswordResponse>(200)
.Produces(400);

// ============================================================================
// API ENDPOINTS - USER PROFILE
// ============================================================================

app.MapGet("/profile", async (IMediator mediator, HttpContext context) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserProfileQuery(userId);
    return await mediator.SendQuery(query);
})
.WithName("GetUserProfile")
.WithSummary("Get user profile")
.WithDescription("Retrieves the authenticated user's profile information")
.WithTags("User Profile")
.RequireAuthorization()
.Produces<UserProfileResponse>(200)
.Produces(404);

app.MapPut("/users/profile", async (IMediator mediator, HttpContext context, UpdateUserProfileCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    // Ensure user can only update their own profile
    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("UpdateUserProfile")
.WithSummary("Update user profile")
.WithDescription("Updates the authenticated user's profile information")
.WithTags("User Profile")
.RequireAuthorization()
.Produces<UpdateUserProfileResponse>(200)
.Produces(400);

// ============================================================================
// API ENDPOINTS - USER MANAGEMENT (Admin)
// ============================================================================

app.MapGet("/users/search", async (IMediator mediator, [AsParameters] SearchUsersQuery query) =>
{
    return await mediator.SendQuery(query);
})
.WithName("SearchUsers")
.WithSummary("Search users (Admin)")
.WithDescription("Search and filter users - Admin access required")
.WithTags("User Management")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<PagedResponse<UserSearchResultResponse>>(200);

app.MapGet("/users/statistics", async (IMediator mediator, [AsParameters] GetUserStatisticsQuery query) =>
{
    return await mediator.SendQuery(query);
})
.WithName("GetUserStatistics")
.WithSummary("Get user statistics (Admin)")
.WithDescription("Retrieves comprehensive user statistics - Admin access required")
.WithTags("User Management")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<UserStatisticsResponse>(200);

app.MapGet("/users/{userId}/activity", async (IMediator mediator, string userId, [AsParameters] GetUserActivityLogQuery query) =>
{
    // Update query with userId from route
    var updatedQuery = query with { UserId = userId };
    return await mediator.SendQuery(updatedQuery);
})
.WithName("GetUserActivity")
.WithSummary("Get user activity log")
.WithDescription("Retrieves user activity log - Admin access or own data required")
.WithTags("User Management")
.RequireAuthorization()
.Produces<PagedResponse<UserActivityResponse>>(200);

// ============================================================================
// API ENDPOINTS - UTILITY
// ============================================================================

app.MapGet("/users/email-availability", async (IMediator mediator, string email) =>
{
    var query = new CheckEmailAvailabilityQuery(email);
    return await mediator.SendQuery(query);
})
.WithName("CheckEmailAvailability")
.WithSummary("Check email availability")
.WithDescription("Checks if an email address is available for registration")
.WithTags("Utility")
.Produces<EmailAvailabilityResponse>(200);

app.MapGet("/users/{userId}/roles", async (IMediator mediator, string userId) =>
{
    var query = new GetUserRolesQuery(userId);
    return await mediator.SendQuery(query);
})
.WithName("GetUserRoles")
.WithSummary("Get user roles")
.WithDescription("Retrieves user roles and permissions")
.WithTags("User Management")
.RequireAuthorization()
.Produces<UserRolesResponse>(200);

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

app.MapGet("/health/ready", async (UserDbContext dbContext) =>
{
    try
    {
        // Simple database connectivity check
        await dbContext.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready", timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Database connection failed: {ex.Message}");
    }
})
.WithName("HealthReady")
.WithSummary("Readiness check")
.WithTags("Health");

app.MapGet("/health/live", () =>
{
    return Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow });
})
.WithName("HealthLive")
.WithSummary("Liveness check")
.WithTags("Health");

// ============================================================================
// HELPER METHODS
// ============================================================================

static string? ExtractUserIdFromContext(HttpContext context)
{
    return context.User.FindFirst("user_id")?.Value
           ?? context.User.FindFirst("sub")?.Value
           ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}

// ============================================================================
// RUN APPLICATION
// ============================================================================

app.Logger.LogInformation("Starting {ServiceName} with enhanced CQRS architecture", serviceName);
app.Logger.LogInformation("JWT Configuration: Issuer={Issuer}, Audience={Audience}, Expiry={Expiry}min",
    issuer, audience, expireMinutes);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
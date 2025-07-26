using System.Reflection;
using System.Security.Claims;
using System.Text;
using Contracts.User.Requests;
using Contracts.User.Responses;
using CQRS.Extensions;
using EventSourcing;
using Infrastructure.Extensions;
using Infrastructure.Middleware;
using Infrastructure.Models;
using Infrastructure.Security;
using MassTransit;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using UserService;
using UserService.Application.Commands;
using UserService.Application.Commands.Favorites;
using UserService.Application.Queries;
using UserService.Application.Queries.Favorites;

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

// Configure Entity Framework with PostgreSQL
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

builder.Services.AddDbContext<UserDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// Event sourcing setup
builder.Services.AddEventSourcing("UserServiceEventStore");

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
builder.Services.AddScoped<IJwtService, JwtService>();
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
builder.Services.AddHttpContextAccessor();
builder.Services.AddSkillSwapAuthorization();

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

RouteGroupBuilder users = app.MapGroup("/users");

#region Auth

// ============================================================================
// API ENDPOINTS - AUTHENTICATION
// ============================================================================

RouteGroupBuilder auth = users.MapGroup("/auth");

auth.MapPost("/register", HandleRegisterUser)
    .WithName("RegisterUser")
    .WithSummary("Register a new user")
    .WithDescription("Creates a new user account with email verification")
    .WithTags("Authentication")
    .Produces<RegisterUserResponse>(201)
    .Produces(400)
    .Produces(409); // Conflict for existing email

auth.MapPost("/login", HandleLoginUser)
    .WithName("LoginUser")
    .WithSummary("Authenticate user")
    .WithDescription("Authenticates user credentials and returns JWT tokens")
    .WithTags("Authentication")
    .Produces<LoginResponse>(200)
    .Produces(401)
    .Produces(403); // For 2FA required

auth.MapPost("/refresh-token", HandleRefreshToken)
    .WithName("RefreshToken")
    .WithSummary("Refresh access token")
    .WithDescription("Refreshes an expired access token using a valid refresh token")
    .WithTags("Authentication")
    .Produces<RefreshTokenResponse>(200)
    .Produces(400)
    .Produces(401);

auth.MapPost("/verify-email", HandleVerifyEmail)
    .WithName("VerifyEmail")
    .WithSummary("Verify email address")
    .WithDescription("Verifies user's email address using verification token")
    .WithTags("Authentication")
    .Produces<VerifyEmailResponse>(200)
    .Produces(400)
    .Produces(404);

auth.MapPost("/resend-verification", HandleResendVerification)
    .WithName("ResendVerification")
    .WithSummary("Resend email verification")
    .WithDescription("Resends email verification token")
    .WithTags("Authentication")
    .Produces<ResendVerificationResponse>(200)
    .Produces(400)
    .Produces(429); // Rate limited

auth.MapPost("/request-password-reset", HandleRequestPasswordReset)
    .WithName("RequestPasswordReset")
    .WithSummary("Request password reset")
    .WithDescription("Sends password reset email to user")
    .WithTags("Password Management")
    .Produces<RequestPasswordResetResponse>(200)
    .Produces(429); // Rate limited

users.MapPost("/reset-password", HandleResetPassword)
    .WithName("ResetPassword")
    .WithSummary("Reset password")
    .WithDescription("Resets user password using reset token")
    .WithTags("Password Management")
    .Produces<ResetPasswordResponse>(200)
    .Produces(400)
    .Produces(404);

#endregion

#region Profile

RouteGroupBuilder profile = users.MapGroup("/profile");

// ============================================================================
// API ENDPOINTS - TWO-FACTOR AUTHENTICATION
// ============================================================================

profile.MapPost("/2fa/generate", HandleGenerateTwoFactorSecret)
    .WithName("GenerateTwoFactorSecret")
    .WithSummary("Generate 2FA secret")
    .WithDescription("Generates a secret key for two-factor authentication")
    .WithTags("Two-Factor Authentication")
    .RequireAuthorization()
    .Produces<GenerateTwoFactorSecretResponse>(200)
    .Produces(401);

profile.MapPost("/2fa/verify", HandleVerifyTwoFactorCode)
    .WithName("VerifyTwoFactorCode")
    .WithSummary("Verify 2FA code")
    .WithDescription("Verifies a TOTP code and enables two-factor authentication")
    .WithTags("Two-Factor Authentication")
    .RequireAuthorization()
    .Produces<VerifyTwoFactorCodeResponse>(200)
    .Produces(400)
    .Produces(401);

profile.MapPost("/2fa/disable", HandleDisableTwoFactor)
    .WithName("DisableTwoFactor")
    .WithSummary("Disable 2FA")
    .WithDescription("Disables two-factor authentication for the user")
    .WithTags("Two-Factor Authentication")
    .RequireAuthorization()
    .Produces<DisableTwoFactorResponse>(200)
    .Produces(400)
    .Produces(401);

profile.MapGet("/2fa/status", HandleGetTwoFactorStatus)
    .WithName("GetTwoFactorStatus")
    .WithSummary("Get 2FA status")
    .WithDescription("Gets the current two-factor authentication status")
    .WithTags("Two-Factor Authentication")
    .RequireAuthorization()
    .Produces<TwoFactorStatusResponse>(200)
    .Produces(401);

// ============================================================================
// API ENDPOINTS - PASSWORD MANAGEMENT
// ============================================================================

profile.MapPost("/change-password", HandleChangePassword)
    .WithName("ChangePassword")
    .WithSummary("Change password")
    .WithDescription("Changes user password (requires authentication)")
    .WithTags("Password Management")
    .RequireAuthorization()
    .Produces<ChangePasswordResponse>(200)
    .Produces(400)
    .Produces(401);

// ============================================================================
// API ENDPOINTS - USER PROFILE
// ============================================================================

profile.MapGet("/", HandleGetUserProfile)
    .WithName("GetUserProfile")
    .WithSummary("Get user profile")
    .WithDescription("Retrieves the authenticated user's profile information")
    .WithTags("User Profile")
    .RequireAuthorization()
    .Produces<UserProfileResponse>(200)
    .Produces(401)
    .Produces(404);

profile.MapPut("/", HandleUpdateUserProfile)
    .WithName("UpdateUserProfile")
    .WithSummary("Update user profile")
    .WithDescription("Updates the authenticated user's profile information")
    .WithTags("User Profile")
    .RequireAuthorization()
    .Produces<UpdateUserProfileResponse>(200)
    .Produces(400)
    .Produces(401);

profile.MapPost("/avatar", HandleUploadAvatar)
    .WithName("UploadAvatar")
    .WithSummary("Upload user avatar")
    .WithDescription("Uploads a new avatar image for the user")
    .WithTags("User Profile")
    .RequireAuthorization()
    .Produces<UploadAvatarResponse>(200)
    .Produces(400)
    .Produces(401);

profile.MapDelete("/avatar", HandleDeleteAvatar)
    .WithName("DeleteAvatar")
    .WithSummary("Delete user avatar")
    .WithDescription("Removes the user's avatar image")
    .WithTags("User Profile")
    .RequireAuthorization()
    .Produces<DeleteAvatarResponse>(200)
    .Produces(401);

// ============================================================================
// API ENDPOINTS - USER AVAILABILITY
// ============================================================================

//profile.MapGet("/availability", HandleGetUserAvailability)
//    .WithName("GetUserAvailability")
//    .WithSummary("Get user availability")
//    .WithDescription("Retrieves the user's availability schedule")
//    .WithTags("User Availability")
//    .RequireAuthorization()
//    .Produces<UserAvailabilityResponse>(200)
//    .Produces(401);

//profile.MapPut("/availability", HandleUpdateUserAvailability)
//    .WithName("UpdateUserAvailability")
//    .WithSummary("Update user availability")
//    .WithDescription("Updates the user's availability schedule")
//    .WithTags("User Availability")
//    .RequireAuthorization()
//    .Produces<UpdateUserAvailabilityResponse>(200)
//    .Produces(400)
//    .Produces(401);

// ============================================================================
// API ENDPOINTS - NOTIFICATION PREFERENCES
// ============================================================================

profile.MapGet("/notifications", HandleGetNotificationPreferences)
    .WithName("GetNotificationPreferences")
    .WithSummary("Get notification preferences")
    .WithDescription("Retrieves the user's notification preferences")
    .WithTags("Notifications")
    .RequireAuthorization()
    .Produces<NotificationPreferencesResponse>(200)
    .Produces(401);

profile.MapPut("/notifications", HandleUpdateNotificationPreferences)
    .WithName("UpdateNotificationPreferences")
    .WithSummary("Update notification preferences")
    .WithDescription("Updates the user's notification preferences")
    .WithTags("Notifications")
    .RequireAuthorization()
    .Produces<UpdateNotificationPreferencesResponse>(200)
    .Produces(400)
    .Produces(401);

// ============================================================================
// API ENDPOINTS - USER BLOCKING
// ============================================================================

profile.MapPost("/block", HandleBlockUser)
    .WithName("BlockUser")
    .WithSummary("Block a user")
    .WithDescription("Blocks a user from interacting with the current user")
    .WithTags("User Management")
    .RequireAuthorization()
    .Produces(200)
    .Produces(400)
    .Produces(401);

profile.MapDelete("/block", HandleUnblockUser)
    .WithName("UnblockUser")
    .WithSummary("Unblock a user")
    .WithDescription("Unblocks a previously blocked user")
    .WithTags("User Management")
    .RequireAuthorization()
    .Produces(200)
    .Produces(400)
    .Produces(401);

profile.MapGet("/blocked", HandleGetBlockedUsers)
    .WithName("GetBlockedUsers")
    .WithSummary("Get blocked users")
    .WithDescription("Retrieves a list of users blocked by the current user")
    .WithTags("User Management")
    .RequireAuthorization()
    .Produces<GetBlockedUsersResponse>(200)
    .Produces(401);

#endregion

#region Users

// ============================================================================
// API ENDPOINTS - FAVORITE SKILLS
// ============================================================================

users.MapGet("/favorites", HandleGetFavoriteSkills)
    .WithName("GetFavoriteSkills")
    .WithSummary("Get user's favorite skills")
    .WithDescription("Retrieves a list of skill IDs that the user has marked as favorite")
    .WithTags("Favorites")
    .RequireAuthorization()
    .Produces<List<string>>(200)
    .Produces(401);

users.MapPost("/favorites", HandleAddFavoriteSkill)
    .WithName("AddFavoriteSkill")
    .WithSummary("Add a skill to user's favorites")
    .WithDescription("Adds a skill to the user's list of favorites")
    .WithTags("Favorites")
    .RequireAuthorization()
    .Produces<bool>(200)
    .Produces(400)
    .Produces(401);

users.MapDelete("/favorites", HandleRemoveFavoriteSkill)
    .WithName("RemoveFavoriteSkill")
    .WithSummary("Remove a skill from user's favorites")
    .WithDescription("Removes a skill from the user's list of favorites")
    .WithTags("Favorites")
    .RequireAuthorization()
    .Produces<bool>(200)
    .Produces(400)
    .Produces(401);

// ============================================================================
// API ENDPOINTS - USER DISCOVERY
// ============================================================================

// users.MapGet("/", HandleGetUserById)
//     .WithName("GetUserById")
//     .WithSummary("Get public user profile by ID")
//     .WithDescription("Retrieves a user's public profile information by userId")
//     .WithTags("User Discovery")
//     .RequireAuthorization()
//     .Produces<PublicUserProfileResponse>(200)
//     .Produces(401)
//     .Produces(404);

users.MapGet("/search", HandleSearchUsers)
    .WithName("SearchUsers")
    .WithSummary("Search users")
    .WithDescription("Search for users by various criteria")
    .WithTags("User Discovery")
    .RequireAuthorization()
    .Produces<PagedResponse<UserSearchResultResponse>>(200)
    .Produces(401);

// ============================================================================
// API ENDPOINTS - UTILITY
// ============================================================================

users.MapGet("/email-availability", HandleCheckEmailAvailability)
    .WithName("CheckEmailAvailability")
    .WithSummary("Check email availability")
    .WithDescription("Checks if an email address is available for registration")
    .WithTags("Utility")
    .Produces<EmailAvailabilityResponse>(200)
    .Produces(400);

users.MapGet("/roles", HandleGetUserRoles)
    .WithName("GetUserRoles")
    .WithSummary("Get user roles")
    .WithDescription("Retrieves user roles and permissions")
    .WithTags("User Management")
    .RequireAuthorization()
    .Produces<UserRolesResponse>(200)
    .Produces(401)
    .Produces(403);

#endregion

#region Admin

RouteGroupBuilder admin = app.MapGroup("/admin");

// ============================================================================
// API ENDPOINTS - ADMIN USER MANAGEMENT
// ============================================================================

admin.MapGet("/users", HandleGetAllUsers)
    .WithName("GetAllUsers")
    .WithSummary("Get all users (Admin)")
    .WithDescription("Retrieves all users with filtering and pagination - Admin access required")
    .WithTags("Admin")
    .RequireAuthorization(Policies.RequireAdminRole)
    .Produces<PagedResponse<UserAdminResponse>>(200)
    .Produces(401)
    .Produces(403);

admin.MapGet("/users/statistics", HandleGetUserStatistics)
    .WithName("GetUserStatistics")
    .WithSummary("Get user statistics (Admin)")
    .WithDescription("Retrieves comprehensive user statistics - Admin access required")
    .WithTags("Admin")
    .RequireAuthorization(Policies.RequireAdminRole)
    .Produces<UserStatisticsResponse>(200)
    .Produces(401)
    .Produces(403);

admin.MapPut("/users/status", HandleUpdateUserStatus)
    .WithName("UpdateUserStatus")
    .WithSummary("Update user status (Admin)")
    .WithDescription("Updates a user's status (active, suspended, banned) - Admin access required")
    .WithTags("Admin")
    .RequireAuthorization(Policies.RequireAdminRole)
    .Produces(200)
    .Produces(400)
    .Produces(401)
    .Produces(403);

admin.MapGet("/admin/users/activity", HandleGetUserActivity)
    .WithName("GetUserActivity")
    .WithSummary("Get user activity log (Admin)")
    .WithDescription("Retrieves user activity log - Admin access required")
    .WithTags("Admin")
    .RequireAuthorization(Policies.RequireAdminRole)
    .Produces<PagedResponse<UserActivityResponse>>(200)
    .Produces(401)
    .Produces(403);

#endregion

#region Health

RouteGroupBuilder health = app.MapGroup("/health");

// ============================================================================
// API ENDPOINTS - HEALTH CHECK
// ============================================================================

health.MapGet("/ready", HandleHealthReady)
    .WithName("HealthReady")
    .WithSummary("Readiness check")
    .WithTags("Health");

health.MapGet("/live", HandleHealthLive)
    .WithName("HealthLive")
    .WithSummary("Liveness check")
    .WithTags("Health");

#endregion

#region Events

RouteGroupBuilder events = app.MapGroup("/events");

// ============================================================================
// API ENDPOINTS - EVENTS (Development)
// ============================================================================

events.MapPost("/replay", HandleReplayEvents)
    .WithName("ReplayEvents")
    .WithSummary("Replay domain events")
    .WithTags("Events");

#endregion

#region Auth Methods

// ============================================================================
// HANDLER METHODS - AUTHENTICATION
// ============================================================================

static async Task<IResult> HandleRegisterUser(IMediator mediator, [FromBody] RegisterUserRequest request)
{
    var command = new RegisterUserCommand(request.Email, request.Password, request.FirstName, request.LastName, request.UserName, request.ReferralCode);
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleLoginUser(IMediator mediator, [FromBody] LoginRequest request)
{
    var command = LoginUserCommand.FromRequest(request);
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleRefreshToken(IMediator mediator, HttpRequest http, [FromBody] RefreshTokenRequest request)
{
    var accessToken = http.Headers["Authorization"].ToString().Replace("Bearer ", string.Empty);
    var command = new RefreshTokenCommand(accessToken, request.RefreshToken) { UserId = null };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleVerifyEmail(IMediator mediator, [FromBody] VerifyEmailRequest request)
{
    var command = new VerifyEmailCommand(request.Token, request.Email);
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleResendVerification(IMediator mediator, [FromBody] ResendVerificationRequest request)
{
    var command = new ResendVerificationCommand(request.Email);
    return await mediator.SendCommand(command);
}

#endregion

// ============================================================================
// HANDLER METHODS - TWO-FACTOR AUTHENTICATION
// ============================================================================

static async Task<IResult> HandleGenerateTwoFactorSecret(IMediator mediator, ClaimsPrincipal user, [FromBody] GenerateTwoFactorSecretRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new GenerateTwoFactorSecretCommand { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleVerifyTwoFactorCode(IMediator mediator, ClaimsPrincipal user, [FromBody] VerifyTwoFactorCodeRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new VerifyTwoFactorCodeCommand(request.Code) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleDisableTwoFactor(IMediator mediator, ClaimsPrincipal user, [FromBody] DisableTwoFactorRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new DisableTwoFactorCommand(request.Password) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleGetTwoFactorStatus(IMediator mediator, ClaimsPrincipal user, [FromBody] GetTwoFactorStatusRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetTwoFactorStatusQuery { UserId = userId };
    return await mediator.SendQuery(query);
}

// ============================================================================
// HANDLER METHODS - PASSWORD MANAGEMENT
// ============================================================================

static async Task<IResult> HandleRequestPasswordReset(IMediator mediator, [FromBody] RequestPasswordResetRequest request)
{
    var command = new RequestPasswordResetCommand(request.PlaceholderParam);
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleResetPassword(IMediator mediator, [FromBody] ResetPasswordRequest request)
{
    var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword);
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleChangePassword(IMediator mediator, ClaimsPrincipal user, [FromBody] ChangePasswordRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword) { UserId = userId };
    return await mediator.SendCommand(command);
}

// ============================================================================
// HANDLER METHODS - USER PROFILE
// ============================================================================

static async Task<IResult> HandleGetUserProfile(IMediator mediator, ClaimsPrincipal user, [FromBody] GetUserProfileRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserProfileQuery { UserId = userId };
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleUpdateUserProfile(IMediator mediator, ClaimsPrincipal user, [FromBody] UpdateUserProfileRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateUserProfileCommand(request.FirstName, request.LastName, request.UserName, request.Bio, request.Location, request.Skills) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleUploadAvatar(IMediator mediator, ClaimsPrincipal user, [FromBody] UploadAvatarRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UploadAvatarCommand(request.FileName, request.ContentType, request.FileContent) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleDeleteAvatar(IMediator mediator, ClaimsPrincipal user, [FromBody] DeleteAvatarRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new DeleteAvatarCommand { UserId = userId };
    return await mediator.SendCommand(command);
}

// ============================================================================
// HANDLER METHODS - USER AVAILABILITY
// ============================================================================

//static async Task<IResult> HandleGetUserAvailability(IMediator mediator, ClaimsPrincipal user, GetUserAvailabilityQuery query)
//{
//    var userId = user.GetUserId();
//    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//    var updatedQuery = query with { UserId = userId };
//    return await mediator.SendQuery(query);
//}

//static async Task<IResult> HandleUpdateUserAvailability(IMediator mediator, ClaimsPrincipal user, UpdateUserAvailabilityCommand command)
//{
//    var userId = user.GetUserId();
//    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//    var updatedCommand = command with { UserId = userId };
//    return await mediator.SendCommand(updatedCommand);
//}

// ============================================================================
// HANDLER METHODS - NOTIFICATION PREFERENCES
// ============================================================================

static async Task<IResult> HandleGetNotificationPreferences(IMediator mediator, ClaimsPrincipal user, [FromBody] GetNotificationPreferencesRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetNotificationPreferencesQuery { UserId = userId };
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleUpdateNotificationPreferences(IMediator mediator, ClaimsPrincipal user, [FromBody] UpdateNotificationPreferencesRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateNotificationPreferencesCommand(request.EmailEnabled, request.PushEnabled, request.SmsEnabled) { UserId = userId };
    return await mediator.SendCommand(command);
}

// ============================================================================
// HANDLER METHODS - FAVORITE SKILLS
// ============================================================================

static async Task<IResult> HandleGetFavoriteSkills(IMediator mediator, ClaimsPrincipal user, [FromBody] GetFavoriteSkillsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetFavoriteSkillsQuery(request.PageNumber, request.PageSize) { UserId = userId };
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleAddFavoriteSkill(IMediator mediator, ClaimsPrincipal user, [FromBody] AddFavoriteSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AddFavoriteSkillCommand(request.SkillId) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleRemoveFavoriteSkill(IMediator mediator, ClaimsPrincipal user, [FromBody] RemoveFavoriteSkillRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RemoveFavoriteSkillCommand(request.SkillId) { UserId = userId };
    return await mediator.SendCommand(command);
}

// ============================================================================
// HANDLER METHODS - USER DISCOVERY
// ============================================================================

// static async Task<IResult> HandleGetUserById(IMediator mediator, ClaimsPrincipal user, [FromBody] GetPublicUserProfileQuery query)
// {
//     var userId = user.GetUserId();
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedQuery = query with { UserId = userId };
//     return await mediator.SendQuery(updatedQuery);
// }

static async Task<IResult> HandleSearchUsers(IMediator mediator, ClaimsPrincipal user, [FromBody] SearchUsersRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new SearchUsersQuery(request.SearchTerm, request.Skills, request.Location, request.PageNumber, request.PageSize);
    return await mediator.SendQuery(query);
}

// ============================================================================
// HANDLER METHODS - USER BLOCKING
// ============================================================================

static async Task<IResult> HandleBlockUser(IMediator mediator, ClaimsPrincipal user, [FromBody] BlockUserRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new BlockUserCommand(request.TargetUserId) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleUnblockUser(IMediator mediator, ClaimsPrincipal user, [FromBody] UnblockUserRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UnblockUserCommand(request.TargetUserId) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleGetBlockedUsers(IMediator mediator, ClaimsPrincipal user, [FromBody] GetBlockedUsersRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetBlockedUsersQuery(request.PageNumber, request.PageSize) { UserId = userId };
    return await mediator.SendQuery(query);
}

// ============================================================================
// HANDLER METHODS - ADMIN USER MANAGEMENT
// ============================================================================

static async Task<IResult> HandleGetAllUsers(IMediator mediator, ClaimsPrincipal user, [FromBody] GetAllUsersRequest request)
{
    var query = new GetAllUsersQuery();
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleGetUserStatistics(IMediator mediator, ClaimsPrincipal user, [FromBody] GetUserStatisticsRequest request)
{
    var query = new GetUserStatisticsQuery();
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleUpdateUserStatus(IMediator mediator, ClaimsPrincipal user, [FromBody] UpdateUserStatusRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateUserStatusCommand(request.PlaceholderParam, "", null, userId) { UserId = userId };
    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleGetUserActivity(IMediator mediator, ClaimsPrincipal user, [FromBody] GetUserActivityRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserActivityLogQuery(userId, 1, 20);
    return await mediator.SendQuery(query);
}

// ============================================================================
// HANDLER METHODS - UTILITY
// ============================================================================

static async Task<IResult> HandleCheckEmailAvailability(IMediator mediator, [FromBody] CheckEmailAvailabilityRequest request)
{
    var query = new CheckEmailAvailabilityQuery(request.PlaceholderParam);
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleGetUserRoles(IMediator mediator, ClaimsPrincipal user, [FromBody] GetUserRolesRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    // Users can only see their own roles unless they are admin
    if (!user.IsInRole("Admin"))
    {
        return Results.Forbid();
    }

    var query = new GetUserRolesQuery(userId);
    return await mediator.SendQuery(query);
}

// ============================================================================
// HANDLER METHODS - HEALTH CHECK
// ============================================================================

static async Task<IResult> HandleHealthReady(UserDbContext dbContext)
{
    var canConnect = await dbContext.Database.CanConnectAsync();
    return Results.Ok(new { status = canConnect ? "ready" : "not ready", timestamp = DateTime.UtcNow });
}

static Task<IResult> HandleHealthLive()
{
    return Task.FromResult(Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }));
}

// ============================================================================
// HANDLER METHODS - EVENTS
// ============================================================================

static async Task<IResult> HandleReplayEvents(EventReplayService replayService)
{
    try
    {
        await replayService.ReplayAsync();
        return Results.Ok(new { message = "Events replayed successfully" });
    }
    catch (Exception)
    {
        return Results.Problem("An error occurred while replaying events", statusCode: 500);
    }
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
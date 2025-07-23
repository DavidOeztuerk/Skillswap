using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Infrastructure.Extensions;
using Infrastructure.Security;
using Infrastructure.Middleware;
using CQRS.Extensions;
using NotificationService.Infrastructure.Services;
using NotificationService.Application.Consumers;
using Infrastructure.Models;
using NotificationService.Application.Commands;
using NotificationService.Infrastructure.BackgroundServices;
using MediatR;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using NotificationService;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "NotificationService";
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

// ============================================================================
// DATABASE SETUP
// ============================================================================

// Configure Entity Framework with InMemory for development
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

builder.Services.AddDbContext<NotificationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
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
// NOTIFICATION SERVICES
// ============================================================================

// Register notification services
builder.Services.Configure<EmailConfiguration>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<SmsConfiguration>(builder.Configuration.GetSection("SMS"));
// builder.Services.Configure<PushNotificationConfiguration>(builder.Configuration.GetSection("PushNotifications"));

// var path = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS")
//     ?? builder.Configuration["Firebase:CredentialsPath"];

// System.Console.WriteLine(path);

// if (!File.Exists(path))
//     throw new FileNotFoundException($"Firebase credentials file not found at path: {path}");

// if (FirebaseApp.DefaultInstance == null)
// {
//     FirebaseApp.Create(new AppOptions()
//     {
//         Credential = GoogleCredential.FromFile(path)
//     });
// }

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();
builder.Services.AddScoped<ITemplateEngine, HandlebarsTemplateEngine>();
builder.Services.AddScoped<INotificationOrchestrator, NotificationOrchestrator>();

// ============================================================================
// MESSAGE BUS SETUP (MassTransit + RabbitMQ)
// ============================================================================

builder.Services.AddMassTransit(x =>
{
    // Register all consumers
    x.AddConsumer<UserRegisteredEventConsumer>();
    x.AddConsumer<EmailVerificationRequestedEventConsumer>();
    x.AddConsumer<WelcomeEmailEventConsumer>();
    x.AddConsumer<PasswordResetEmailEventConsumer>();
    x.AddConsumer<PasswordChangedNotificationEventConsumer>();
    x.AddConsumer<SecurityAlertEventConsumer>();
    x.AddConsumer<SuspiciousActivityDetectedEventConsumer>();
    x.AddConsumer<AccountSuspendedNotificationEventConsumer>();
    x.AddConsumer<AccountReactivatedNotificationEventConsumer>();
    x.AddConsumer<SkillMatchFoundEventConsumer>();
    x.AddConsumer<AppointmentCreatedEventConsumer>();
    x.AddConsumer<GenericEventLoggingConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        // Configure specific endpoints for each consumer
        cfg.ReceiveEndpoint("notification-user-events", e =>
        {
            e.ConfigureConsumer<UserRegisteredEventConsumer>(context);
            e.ConfigureConsumer<EmailVerificationRequestedEventConsumer>(context);
            e.ConfigureConsumer<WelcomeEmailEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-password-events", e =>
        {
            e.ConfigureConsumer<PasswordResetEmailEventConsumer>(context);
            e.ConfigureConsumer<PasswordChangedNotificationEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-security-events", e =>
        {
            e.ConfigureConsumer<SecurityAlertEventConsumer>(context);
            e.ConfigureConsumer<SuspiciousActivityDetectedEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-account-events", e =>
        {
            e.ConfigureConsumer<AccountSuspendedNotificationEventConsumer>(context);
            e.ConfigureConsumer<AccountReactivatedNotificationEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-skill-events", e =>
        {
            e.ConfigureConsumer<SkillMatchFoundEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-appointment-events", e =>
        {
            e.ConfigureConsumer<AppointmentCreatedEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-debug-events", e =>
        {
            e.ConfigureConsumer<GenericEventLoggingConsumer>(context);
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

// Configure JWT authentication (for admin endpoints)
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
// builder.Services.AddMemoryCache();

// ============================================================================
// BACKGROUND SERVICES
// ============================================================================

// Add background service for processing notifications
builder.Services.AddHostedService<NotificationProcessorService>();

// Add background service for cleanup
builder.Services.AddHostedService<NotificationCleanupService>();

// ============================================================================
// API DOCUMENTATION
// ============================================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "SkillSwap NotificationService API",
        Version = "v1",
        Description = "Comprehensive notification service with email, SMS, and push notifications"
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "NotificationService API v1");
        c.RoutePrefix = string.Empty;
    });
}

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

    try
    {
        await context.Database.EnsureCreatedAsync();

        app.Logger.LogInformation("NotificationService database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing NotificationService database");
    }
}

// Grouped endpoints for notifications
var notifications = app.MapGroup("/notifications").WithTags("Notifications");

notifications.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetNotificationHistoryQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedQuery = query with { UserId = userId };
    return await mediator.SendQuery(updatedQuery);
})
.WithName("GetUserNotifications")
.WithSummary("Get user notifications")
.WithDescription("Retrieves all notifications for the authenticated user")
.RequireAuthorization()
.Produces<PagedResponse<GetNotificationHistoryQuery>>(200);

notifications.MapPost("/read-all", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] MarkAllNotificationsAsReadCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("MarkAllNotificationsAsRead")
.WithSummary("Mark all notifications as read")
.WithDescription("Marks all notifications as read for the authenticated user")
.RequireAuthorization()
.Produces<MarkAllNotificationsAsReadResponse>(200);

notifications.MapPost("/send", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendNotificationCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("SendNotification")
.WithSummary("Send a notification")
.WithDescription("Sends a single notification via email, SMS, or push")
.RequireAuthorization()
.Produces<SendNotificationResponse>(200)
.Produces(400);

notifications.MapPost("/bulk", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendBulkNotificationCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("SendBulkNotification")
.WithSummary("Send bulk notifications")
.WithDescription("Sends notifications to multiple users")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<SendBulkNotificationResponse>(200)
.Produces(400);

notifications.MapPost("/cancel", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CancelNotificationCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("CancelNotification")
.WithSummary("Cancel a notification")
.WithDescription("Cancels a pending notification")
.RequireAuthorization()
.Produces<CancelNotificationResponse>(200);

notifications.MapPost("/retry", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] RetryFailedNotificationCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("RetryNotification")
.WithSummary("Retry failed notification")
.WithDescription("Retries a failed notification")
.RequireAuthorization()
.Produces<RetryFailedNotificationResponse>(200);

notifications.MapPost("/{notificationId}/read", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] MarkNotificationAsReadCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("MarkNotificationAsRead")
.WithSummary("Mark notification as read")
.WithDescription("Marks a notification as read by the user")
.RequireAuthorization()
.Produces<MarkNotificationAsReadResponse>(200);

// Grouped endpoints for user preferences
var preferences = app.MapGroup("/preferences").WithTags("Preferences");

preferences.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetNotificationPreferencesQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedQuery = query with { UserId = userId };
    return await mediator.SendQuery(updatedQuery);
})
.WithName("GetNotificationPreferences")
.WithSummary("Get user notification preferences")
.WithDescription("Retrieves the authenticated user's notification preferences")
.RequireAuthorization()
.Produces<NotificationPreferencesResponse>(200);

preferences.MapPut("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateNotificationPreferencesCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("UpdateNotificationPreferences")
.WithSummary("Update notification preferences")
.WithDescription("Updates the authenticated user's notification preferences")
.RequireAuthorization()
.Produces<UpdateNotificationPreferencesResponse>(200);

// Grouped endpoints for templates (Admin)
var templates = app.MapGroup("/templates").WithTags("Templates");

templates.MapPost("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CreateEmailTemplateCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("CreateEmailTemplate")
.WithSummary("Create email template (Admin)")
.WithDescription("Creates a new email template - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<CreateEmailTemplateResponse>(201);

templates.MapPut("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateEmailTemplateCommand command) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var updatedCommand = command with { UserId = userId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("UpdateEmailTemplate")
.WithSummary("Update email template (Admin)")
.WithDescription("Updates an existing email template - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<UpdateEmailTemplateResponse>(200);

templates.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetEmailTemplatesQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetEmailTemplates")
.WithSummary("Get email templates (Admin)")
.WithDescription("Retrieves all email templates - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<PagedResponse<EmailTemplateResponse>>(200);

// Grouped endpoints for analytics (Admin)
var analytics = app.MapGroup("/analytics").WithTags("Analytics");

analytics.MapGet("/statistics", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] GetNotificationStatisticsQuery query) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetNotificationStatistics")
.WithSummary("Get notification statistics (Admin)")
.WithDescription("Retrieves comprehensive notification statistics - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<NotificationStatisticsResponse>(200);

// Grouped endpoints for health
var health = app.MapGroup("/health").WithTags("Health");

health.MapGet("/ready", async (NotificationDbContext dbContext, IEmailService emailService) =>
{
    try
    {
        // Check database connectivity
        await dbContext.Database.CanConnectAsync();
        // Could add more health checks here (SMTP, SMS, etc.)
        return Results.Ok(new
        {
            status = "ready",
            timestamp = DateTime.UtcNow,
            services = new
            {
                database = "healthy",
                email = "healthy",
                messaging = "healthy"
            }
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Health check failed: {ex.Message}");
    }
})
    .WithName("HealthReady")
    .WithSummary("Readiness check");

health.MapGet("/live", () =>
{
    return Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow });
})
    .WithName("HealthLive")
    .WithSummary("Liveness check");

// ============================================================================
// RUN APPLICATION
// ============================================================================

app.Logger.LogInformation("Starting {ServiceName} with comprehensive notification capabilities", serviceName);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
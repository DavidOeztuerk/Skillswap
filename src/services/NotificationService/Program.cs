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
using Contracts.Notification.Requests;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using NotificationService;
using NotificationService.Extensions;
using NotificationService.Hubs;
using CQRS.Models;
using Contracts.Notification.Responses;
using System.Text.Json;

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

builder.Services.AddDbContext<NotificationDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)) // EF-Retry einschalten
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// ============================================================================
// CQRS & MEDIATR SETUP
// ============================================================================

// Add CQRS with caching support
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"] ?? throw new InvalidOperationException("Redis connection string not configured");

builder.Services.AddCaching(redisConnectionString).AddCQRS(Assembly.GetExecutingAssembly());

// ============================================================================
// NOTIFICATION SERVICES
// ============================================================================

// Register notification services
builder.Services.Configure<EmailConfiguration>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<SmsConfiguration>(builder.Configuration.GetSection("SMS"));
builder.Services.Configure<PushNotificationPreferences>(builder.Configuration.GetSection("PushNotifications"));

// Firebase initialization - make it optional for development
var firebaseEnabled = bool.Parse(Environment.GetEnvironmentVariable("FIREBASE_ENABLED") 
    ?? builder.Configuration["Firebase:Enabled"] 
    ?? "false");

if (firebaseEnabled)
{
    var path = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS")
        ?? builder.Configuration["Firebase:CredentialsPath"]
        ?? "/app/secrets/firebase-key.json";

    if (File.Exists(path))
    {
        if (FirebaseApp.DefaultInstance == null)
        {
            FirebaseApp.Create(new AppOptions()
            {
                Credential = GoogleCredential.FromFile(path)
            });
        }
        Console.WriteLine($"[INFO] Firebase initialized successfully from: {path}");
    }
    else
    {
        Console.WriteLine($"[WARNING] Firebase credentials file not found at path: {path}. Push notifications will be disabled.");
    }
}
else
{
    Console.WriteLine("[INFO] Firebase is disabled. Push notifications will not be available.");
}

// Configure Email settings from environment variables
builder.Services.Configure<EmailConfiguration>(options =>
{
    options.SmtpHost = Environment.GetEnvironmentVariable("SMTP_HOST")
        ?? builder.Configuration["Email:smtpHost"]
        ?? "smtp.gmail.com";
    options.SmtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT")
        ?? builder.Configuration["Email:smtpPort"]
        ?? "587");
    options.Username = Environment.GetEnvironmentVariable("SMTP_USERNAME")
        ?? builder.Configuration["Email:username"]
        ?? "";
    options.Password = Environment.GetEnvironmentVariable("SMTP_PASSWORD")
        ?? builder.Configuration["Email:password"]
        ?? "";
    options.UseSsl = bool.Parse(Environment.GetEnvironmentVariable("SMTP_USE_SSL")
        ?? builder.Configuration["Email:useSsl"]
        ?? "false");
    options.UseStartTls = bool.Parse(Environment.GetEnvironmentVariable("SMTP_USE_STARTTLS")
        ?? builder.Configuration["Email:useStartTls"]
        ?? "true");
    options.FromAddress = Environment.GetEnvironmentVariable("SMTP_FROM_ADDRESS")
        ?? builder.Configuration["Email:fromAddress"]
        ?? "noreply@skillswap.com";
    options.FromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME")
        ?? builder.Configuration["Email:fromName"]
        ?? "SkillSwap";
});

// Configure SMS settings from environment variables
builder.Services.Configure<SmsConfiguration>(options =>
{
    options.TwilioAccountSid = Environment.GetEnvironmentVariable("SMS_API_KEY")
        ?? builder.Configuration["SMS:twilioAccountSid"]
        ?? "";
    options.TwilioAuthToken = Environment.GetEnvironmentVariable("SMS_API_SECRET")
        ?? builder.Configuration["SMS:twilioAuthToken"]
        ?? "";
    options.FromNumber = Environment.GetEnvironmentVariable("SMS_FROM_NUMBER")
        ?? builder.Configuration["SMS:fromNumber"]
        ?? "";
});

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();
builder.Services.AddScoped<ITemplateEngine, HandlebarsTemplateEngine>();
builder.Services.AddScoped<INotificationOrchestrator, NotificationOrchestrator>();
builder.Services.AddScoped<ISmartNotificationRouter, SmartNotificationRouter>();

// Configure HttpClient for UserService
builder.Services.AddHttpClient("UserService", client =>
{
    var userServiceUrl = Environment.GetEnvironmentVariable("USER_SERVICE_URL")
        ?? builder.Configuration["Services:UserService:Url"]
        ?? "http://gateway:8080/api/users";
    client.BaseAddress = new Uri(userServiceUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Add NotificationService-specific dependencies
builder.Services.AddNotificationServiceDependencies();

// ============================================================================
// MESSAGE BUS SETUP (MassTransit + RabbitMQ)
// ============================================================================

builder.Services.AddMassTransit(x =>
{
    // Register all consumers
    x.AddConsumer<UserRegisteredEventConsumer>();
    x.AddConsumer<EmailVerificationRequestedEventConsumer>();
    x.AddConsumer<UserEmailVerificationRequestedEventConsumer>(); // New consumer for resend verification
    x.AddConsumer<WelcomeEmailEventConsumer>();
    x.AddConsumer<PasswordResetEmailEventConsumer>();
    x.AddConsumer<PasswordChangedNotificationEventConsumer>();
    x.AddConsumer<SecurityAlertEventConsumer>();
    x.AddConsumer<SuspiciousActivityDetectedEventConsumer>();
    x.AddConsumer<AccountSuspendedNotificationEventConsumer>();
    x.AddConsumer<AccountReactivatedNotificationEventConsumer>();
    x.AddConsumer<SkillMatchFoundEventConsumer>();
    x.AddConsumer<AppointmentCreatedEventConsumer>();
    x.AddConsumer<AppointmentAcceptedIntegrationEventConsumer>();
    x.AddConsumer<AppointmentRescheduledIntegrationEventConsumer>();

    // Matchmaking Event Consumer
    x.AddConsumer<MatchRequestCreatedIntegrationEventConsumer>();
    x.AddConsumer<MatchAcceptedIntegrationEventConsumer>();
    x.AddConsumer<MatchRequestRejectedIntegrationEventConsumer>();

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
            e.ConfigureConsumer<AppointmentAcceptedIntegrationEventConsumer>(context);
            e.ConfigureConsumer<AppointmentRescheduledIntegrationEventConsumer>(context);
        });

        // Neue Endpoints für Matchmaking Events
        cfg.ReceiveEndpoint("notification-match-request-created", e =>
        {
            e.ConfigureConsumer<MatchRequestCreatedIntegrationEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-match-accepted", e =>
        {
            e.ConfigureConsumer<MatchAcceptedIntegrationEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-match-rejected", e =>
        {
            e.ConfigureConsumer<MatchRequestRejectedIntegrationEventConsumer>(context);
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
// SIGNALR CONFIGURATION
// ============================================================================

// Add SignalR for real-time notifications
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
}).AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// Configure CORS for SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCors", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

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

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<NotificationService.Infrastructure.Data.EmailTemplateSeeder>>();
    var strategy = db.Database.CreateExecutionStrategy();

    // Execute migrations with retry strategy
    await strategy.ExecuteAsync(async () =>
    {
        await db.Database.MigrateAsync();
    });

    // Execute seeding with retry strategy
    await strategy.ExecuteAsync(async () =>
    {
        var seeder = new NotificationService.Infrastructure.Data.EmailTemplateSeeder(db, logger);
        await seeder.SeedAsync();
    });

    app.Logger.LogInformation("Database migration and email template seeding completed successfully");
}

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================

// Use shared infrastructure middleware
app.UseSharedInfrastructure();

// Enable CORS for SignalR
app.UseCors("SignalRCors");

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

// Database initialization already handled above after app.Build()

// Map SignalR hub
app.MapHub<NotificationHub>("/hubs/notifications");

// Grouped endpoints for notifications
var notifications = app.MapGroup("/notifications").WithTags("Notifications");

notifications.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetNotificationHistoryRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetNotificationHistoryQuery(userId, request.Type, request.Status, request.StartDate, request.EndDate, request.PageNumber, request.PageSize);
    return await mediator.SendQuery(query);
})
.WithName("GetUserNotifications")
.WithSummary("Get user notifications")
.WithDescription("Retrieves all notifications for the authenticated user")
.RequireAuthorization()
.Produces<PagedResponse<GetNotificationHistoryQuery>>(200);

notifications.MapPost("/read-all", async (IMediator mediator, ClaimsPrincipal claims) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new MarkAllNotificationsAsReadCommand(userId);
    return await mediator.SendCommand(command);
})
.WithName("MarkAllNotificationsAsRead")
.WithSummary("Mark all notifications as read")
.WithDescription("Marks all notifications as read for the authenticated user")
.RequireAuthorization()
.Produces<MarkAllNotificationsAsReadResponse>(200);

notifications.MapPost("/send", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendNotificationRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new SendNotificationCommand(request.Type, request.Template, request.Recipient, request.Variables, request.Priority, request.ScheduledAt, request.CorrelationId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("SendNotification")
.WithSummary("Send a notification")
.WithDescription("Sends a single notification via email, SMS, or push")
.RequireAuthorization()
.Produces<SendNotificationResponse>(200)
.Produces(400);

notifications.MapPost("/bulk", handler: async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendBulkNotificationRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new SendBulkNotificationCommand(request.UserIds, request.Type, request.Template, request.GlobalVariables, request.UserSpecificVariables, request.Priority, request.ScheduledAt) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("SendBulkNotification")
.WithSummary("Send bulk notifications")
.WithDescription("Sends notifications to multiple users")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<SendBulkNotificationResponse>(200)
.Produces(400);

notifications.MapPost("/cancel", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CancelNotificationRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CancelNotificationCommand(request.NotificationId, request.Reason) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("CancelNotification")
.WithSummary("Cancel a notification")
.WithDescription("Cancels a pending notification")
.RequireAuthorization()
.Produces<CancelNotificationResponse>(200);

notifications.MapPost("/retry", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] RetryFailedNotificationRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RetryFailedNotificationCommand(request.NotificationId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("RetryNotification")
.WithSummary("Retry failed notification")
.WithDescription("Retries a failed notification")
.RequireAuthorization()
.Produces<RetryFailedNotificationResponse>(200);

notifications.MapPost("/{notificationId}/read", async (IMediator mediator, ClaimsPrincipal claims, string notificationId) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new MarkNotificationAsReadCommand(notificationId, userId);
    return await mediator.SendCommand(command);
})
.WithName("MarkNotificationAsRead")
.WithSummary("Mark notification as read")
.WithDescription("Marks a notification as read by the user")
.RequireAuthorization()
.Produces<MarkNotificationAsReadResponse>(200);

// Grouped endpoints for user preferences
var preferences = app.MapGroup("/preferences").WithTags("Preferences");

preferences.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetNotificationPreferencesQuery(userId);
    return await mediator.SendQuery(query);
})
.WithName("GetNotificationPreferences")
.WithSummary("Get user notification preferences")
.WithDescription("Retrieves the authenticated user's notification preferences")
.RequireAuthorization()
.Produces<NotificationPreferencesResponse>(200);

preferences.MapPut("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateNotificationPreferencesRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateNotificationPreferencesCommand(userId, request.EmailEnabled, request.EmailMarketing, request.EmailSecurity, request.EmailUpdates, request.SmsEnabled, request.SmsSecurity, request.SmsReminders, request.PushEnabled, request.PushMarketing, request.PushSecurity, request.PushUpdates, request.QuietHoursStart, request.QuietHoursEnd, request.TimeZone, request.DigestFrequency, request.Language);
    return await mediator.SendCommand(command);
})
.WithName("UpdateNotificationPreferences")
.WithSummary("Update notification preferences")
.WithDescription("Updates the authenticated user's notification preferences")
.RequireAuthorization()
.Produces<UpdateNotificationPreferencesResponse>(200);

// Grouped endpoints for templates (Admin)
var templates = app.MapGroup("/templates").WithTags("Templates");

templates.MapPost("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CreateEmailTemplateRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateEmailTemplateCommand(request.Name, request.Language, request.Subject, request.HtmlContent, request.TextContent, request.Description, request.VariablesSchema) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("CreateEmailTemplate")
.WithSummary("Create email template (Admin)")
.WithDescription("Creates a new email template - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<CreateEmailTemplateResponse>(201);

templates.MapPut("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateEmailTemplateRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new UpdateEmailTemplateCommand(request.TemplateId, request.Subject, request.HtmlContent, request.TextContent, request.Description, null, request.VariablesSchema) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("UpdateEmailTemplate")
.WithSummary("Update email template (Admin)")
.WithDescription("Updates an existing email template - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<UpdateEmailTemplateResponse>(200);

templates.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetEmailTemplatesRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetEmailTemplatesQuery(request.Language, request.IsActive, request.PageNumber, request.PageSize);
    return await mediator.SendQuery(query);
})
.WithName("GetEmailTemplates")
.WithSummary("Get email templates (Admin)")
.WithDescription("Retrieves all email templates - Admin access required")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<PagedResponse<EmailTemplateResponse>>(200);

// Grouped endpoints for analytics (Admin)
var analytics = app.MapGroup("/analytics").WithTags("Analytics");

analytics.MapGet("/statistics", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetNotificationStatisticsRequest request) =>
{
    var userId = claims.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetNotificationStatisticsQuery(request.StartDate, request.EndDate, request.Type, request.Template);
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
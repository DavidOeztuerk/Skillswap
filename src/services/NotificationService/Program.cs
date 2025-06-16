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
using NotificationService.Infrastructure.Data;
using NotificationService.Infrastructure.Services;
using NotificationService.Application.Consumers;
using Contracts.Models;
using Infrastructure.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.BackgroundServices;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================

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
builder.Services.AddDbContext<NotificationDbContext>(options =>
{
    options.UseInMemoryDatabase("NotificationServiceDb");
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// ============================================================================
// CQRS & MEDIATR SETUP
// ============================================================================

// Add CQRS with caching support
builder.Services.AddCQRSWithCaching(builder.Configuration, Assembly.GetExecutingAssembly());

// ============================================================================
// NOTIFICATION SERVICES
// ============================================================================

// Register notification services
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
builder.Services.AddMemoryCache();

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
        
        // Seed default notification preferences and templates
        await SeedDefaultDataAsync(context);
        
        app.Logger.LogInformation("NotificationService database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing NotificationService database");
    }
}

// ============================================================================
// API ENDPOINTS - NOTIFICATION MANAGEMENT
// ============================================================================

app.MapPost("/notifications/send", async (IMediator mediator, SendNotificationCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("SendNotification")
.WithSummary("Send a notification")
.WithDescription("Sends a single notification via email, SMS, or push")
.WithTags("Notifications")
.RequireAuthorization()
.Produces<SendNotificationResponse>(200)
.Produces(400);

app.MapPost("/notifications/bulk", async (IMediator mediator, SendBulkNotificationCommand command) =>
{
    return await mediator.SendCommand(command);
})
.WithName("SendBulkNotification")
.WithSummary("Send bulk notifications")
.WithDescription("Sends notifications to multiple users")
.WithTags("Notifications")
.RequireAuthorization(Policies.RequireAdminRole)
.Produces<SendBulkNotificationResponse>(200)
.Produces(400);

app.MapPost("/notifications/{notificationId}/cancel", async (IMediator mediator, string notificationId, CancelNotificationCommand command) =>
{
    var updatedCommand = command with { NotificationId = notificationId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("CancelNotification")
.WithSummary("Cancel a notification")
.WithDescription("Cancels a pending notification")
.WithTags("Notifications")
.RequireAuthorization()
.Produces<CancelNotificationResponse>(200);

app.MapPost("/notifications/{notificationId}/retry", async (IMediator mediator, string notificationId, RetryFailedNotificationCommand command) =>
{
    var updatedCommand = command with { NotificationId = notificationId };
    return await mediator.SendCommand(updatedCommand);
})
.WithName("RetryNotification")
.WithSummary("Retry failed notification")
.WithDescription("Retries a failed notification")
.WithTags("Notifications")
.RequireAuthorization()
.Produces<RetryFailedNotificationResponse>(200);

app.MapPost("/notifications/{notificationId}/read", async (IMediator mediator, string notificationId, HttpContext context) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new MarkNotificationAsReadCommand(notificationId, userId);
    return await mediator.SendCommand(command);
})
.WithName("MarkNotificationAsRead")
.WithSummary("Mark notification as read")
.WithDescription("Marks a notification as read by the user")
.WithTags("Notifications")
.RequireAuthorization()
.Produces<MarkNotificationAsReadResponse>(200);

// ============================================================================
// API ENDPOINTS - USER PREFERENCES
// ============================================================================

// app.MapGet("/preferences", async (IMediator mediator, HttpContext context) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var query = new GetNotificationPreferencesQuery(userId);
//     return await mediator.SendQuery(query);
// })
// .WithName("GetNotificationPreferences")
// .WithSummary("Get user notification preferences")
// .WithDescription("Retrieves the authenticated user's notification preferences")
// .WithTags("Preferences")
// .RequireAuthorization()
// .Produces<NotificationPreferencesResponse>(200);

// app.MapPut("/preferences", async (IMediator mediator, HttpContext context, UpdateNotificationPreferencesCommand command) =>
// {
//     var userId = ExtractUserIdFromContext(context);
//     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

//     var updatedCommand = command with { UserId = userId };
//     return await mediator.SendCommand(updatedCommand);
// })
// .WithName("UpdateNotificationPreferences")
// .WithSummary("Update notification preferences")
// .WithDescription("Updates the authenticated user's notification preferences")
// .WithTags("Preferences")
// .RequireAuthorization()
// .Produces<UpdateNotificationPreferencesResponse>(200);

// // ============================================================================
// // API ENDPOINTS - TEMPLATES (Admin)
// // ============================================================================

// app.MapPost("/templates", async (IMediator mediator, CreateEmailTemplateCommand command) =>
// {
//     return await mediator.SendCommand(command);
// })
// .WithName("CreateEmailTemplate")
// .WithSummary("Create email template (Admin)")
// .WithDescription("Creates a new email template - Admin access required")
// .WithTags("Templates")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<CreateEmailTemplateResponse>(201);

// app.MapPut("/templates/{templateId}", async (IMediator mediator, string templateId, UpdateEmailTemplateCommand command) =>
// {
//     var updatedCommand = command with { TemplateId = templateId };
//     return await mediator.SendCommand(updatedCommand);
// })
// .WithName("UpdateEmailTemplate")
// .WithSummary("Update email template (Admin)")
// .WithDescription("Updates an existing email template - Admin access required")
// .WithTags("Templates")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<UpdateEmailTemplateResponse>(200);

// app.MapGet("/templates", async (IMediator mediator, [AsParameters] GetEmailTemplatesQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("GetEmailTemplates")
// .WithSummary("Get email templates (Admin)")
// .WithDescription("Retrieves all email templates - Admin access required")
// .WithTags("Templates")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<PagedResponse<EmailTemplateResponse>>(200);

// // ============================================================================
// // API ENDPOINTS - ANALYTICS & REPORTING (Admin)
// // ============================================================================

// app.MapGet("/analytics/statistics", async (IMediator mediator, [AsParameters] GetNotificationStatisticsQuery query) =>
// {
//     return await mediator.SendQuery(query);
// })
// .WithName("GetNotificationStatistics")
// .WithSummary("Get notification statistics (Admin)")
// .WithDescription("Retrieves comprehensive notification statistics - Admin access required")
// .WithTags("Analytics")
// .RequireAuthorization(Policies.RequireAdminRole)
// .Produces<NotificationStatisticsResponse>(200);

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

app.MapGet("/health/ready", async (NotificationDbContext dbContext, IEmailService emailService) =>
{
    try
    {
        // Check database connectivity
        await dbContext.Database.CanConnectAsync();
        
        // Could add more health checks here (SMTP, SMS, etc.)
        
        return Results.Ok(new { 
            status = "ready", 
            timestamp = DateTime.UtcNow,
            services = new {
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

static async Task SeedDefaultDataAsync(NotificationDbContext context)
{
    // Seed default email templates if they don't exist
    if (!await context.EmailTemplates.AnyAsync())
    {
        var defaultTemplates = new[]
        {
            new EmailTemplate
            {
                Name = EmailTemplateNames.Welcome,
                Language = "en",
                Subject = "Welcome to SkillSwap! 🎉",
                HtmlContent = "<h1>Welcome {{FirstName}}!</h1><p>We're excited to have you join our community.</p>",
                TextContent = "Welcome {{FirstName}}! We're excited to have you join our community.",
                IsActive = true,
                Version = "1.0"
            },
            new EmailTemplate
            {
                Name = EmailTemplateNames.EmailVerification,
                Language = "en",
                Subject = "Please verify your email address",
                HtmlContent = "<h1>Verify your email</h1><p>Click <a href='{{VerificationUrl}}'>here</a> to verify.</p>",
                TextContent = "Please verify your email by visiting: {{VerificationUrl}}",
                IsActive = true,
                Version = "1.0"
            }
        };

        context.EmailTemplates.AddRange(defaultTemplates);
        await context.SaveChangesAsync();
    }
}

// ============================================================================
// RUN APPLICATION
// ============================================================================

app.Logger.LogInformation("Starting {ServiceName} with comprehensive notification capabilities", serviceName);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
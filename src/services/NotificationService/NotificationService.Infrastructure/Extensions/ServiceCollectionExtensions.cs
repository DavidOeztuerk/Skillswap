using NotificationService.Infrastructure.Repositories;
using NotificationService.Domain.Repositories;
using NotificationService.Domain.Services;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Infrastructure.Extensions;
using CQRS.Extensions;
using System.Reflection;
using EventSourcing;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using NotificationService.Infrastructure.Services;
using Contracts.Notification.Responses;
using NotificationService.Infrastructure.BackgroundServices;
using Infrastructure.Security;
using Infrastructure.Authorization;
using NotificationService.Infrastructure.HttpClients;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Extensions;

/// <summary>
/// Dependency injection configuration for NotificationService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds NotificationService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string serviceName)
    {

        // Register Unit of Work and Repositories
        services.AddScoped<INotificationUnitOfWork, NotificationUnitOfWork>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IEmailTemplateRepository, EmailTemplateRepository>();
        services.AddScoped<INotificationPreferencesRepository, NotificationPreferencesRepository>();
        services.AddScoped<INotificationEventRepository, NotificationEventRepository>();
        services.AddScoped<INotificationCampaignRepository, NotificationCampaignRepository>();
        services.AddScoped<INotificationDigestEntryRepository, NotificationDigestEntryRepository>();
        services.Configure<EmailConfiguration>(configuration.GetSection("Email"));
        services.Configure<SmsConfiguration>(configuration.GetSection("SMS"));
        services.Configure<PushNotificationPreferences>(configuration.GetSection("PushNotifications"));

        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddSingleton<IPushNotificationService, PushNotificationService>();
        services.AddScoped<ITemplateEngine, HandlebarsTemplateEngine>();
        services.AddScoped<INotificationOrchestrator, NotificationOrchestrator>();
        services.AddScoped<ISmartNotificationRouter, SmartNotificationRouter>();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration, environment);

        services.AddDatabaseContext<NotificationDbContext>(
            configuration, 
            serviceName);

        services.AddEventSourcing("NotificationServiceEventStore");

        // CRITICAL FIX: Register CQRS handlers from Application layer, not Infrastructure layer!
        services.AddCQRS(typeof(NotificationService.Application.Queries.GetNotificationHistoryQuery).Assembly);

        // Register MassTransit Consumers from Infrastructure layer (where they are located!)
        services.AddMessaging(
            configuration,
            typeof(NotificationService.Infrastructure.Consumers.AppointmentAcceptedIntegrationEventConsumer).Assembly);

        // Configure HttpClient for UserService
        services.AddHttpClient("UserService", client =>
        {
            var userServiceUrl = Environment.GetEnvironmentVariable("USER_SERVICE_URL")
                ?? configuration["Services:UserService:Url"]
                ?? "http://gateway:8080/api/users";
            client.BaseAddress = new Uri(userServiceUrl);
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        var firebaseEnabled = bool.Parse(Environment.GetEnvironmentVariable("FIREBASE_ENABLED")
            ?? configuration["Firebase:Enabled"]
            ?? "false");

        if (firebaseEnabled)
        {
            var path = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS")
                ?? configuration["Firebase:CredentialsPath"]
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
        services.Configure<EmailConfiguration>(options =>
        {
            options.SmtpHost = Environment.GetEnvironmentVariable("SMTP_HOST")
                ?? configuration["Email:smtpHost"]
                ?? "smtp.gmail.com";
            options.SmtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT")
                ?? configuration["Email:smtpPort"]
                ?? "587");
            options.Username = Environment.GetEnvironmentVariable("SMTP_USERNAME")
                ?? configuration["Email:username"]
                ?? "";
            options.Password = Environment.GetEnvironmentVariable("SMTP_PASSWORD")
                ?? configuration["Email:password"]
                ?? "";
            options.UseSsl = bool.Parse(Environment.GetEnvironmentVariable("SMTP_USE_SSL")
                ?? configuration["Email:useSsl"]
                ?? "false");
            options.UseStartTls = bool.Parse(Environment.GetEnvironmentVariable("SMTP_USE_STARTTLS")
                ?? configuration["Email:useStartTls"]
                ?? "true");
            options.FromAddress = Environment.GetEnvironmentVariable("SMTP_FROM_ADDRESS")
                ?? configuration["Email:fromAddress"]
                ?? "noreply@skillswap.com";
            options.FromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME")
                ?? configuration["Email:fromName"]
                ?? "SkillSwap";
        });

        // Configure SMS settings from environment variables
        services.Configure<SmsConfiguration>(options =>
        {
            options.TwilioAccountSid = Environment.GetEnvironmentVariable("SMS_API_KEY")
                ?? configuration["SMS:twilioAccountSid"]
                ?? "";
            options.TwilioAuthToken = Environment.GetEnvironmentVariable("SMS_API_SECRET")
                ?? configuration["SMS:twilioAuthToken"]
                ?? "";
            options.FromNumber = Environment.GetEnvironmentVariable("SMS_FROM_NUMBER")
                ?? configuration["SMS:fromNumber"]
                ?? "";
        });

        // Add SignalR configuration
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = environment.IsDevelopment();
            options.KeepAliveInterval = TimeSpan.FromSeconds(15);
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        }).AddJsonProtocol(options =>
        {
            options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

        services.AddHostedService<NotificationProcessorService>();
        services.AddHostedService<NotificationCleanupService>();

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        return services;
    }
}
using System.Reflection;
using CQRS.Extensions;
using EventSourcing;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UserService.Domain.Repositories;
using UserService.Domain.Services;
using UserService.Infrastructure.Repositories;
using UserService.Infrastructure.HttpClients;
using UserService.Application.Services;
using UserService.Infrastructure.Services;
using UserService.Infrastructure.Services.Calendar;
using UserService.Infrastructure.BackgroundServices;

namespace UserService.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string serviceName)
    {
        // Repository registration
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ITwoFactorRepository, TwoFactorRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<IUserSkillsRepository, UserSkillsRepository>();
        services.AddScoped<IUserBlockingRepository, UserBlockingRepository>();
        services.AddScoped<IUserActivityRepository, UserActivityRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IUserCalendarConnectionRepository, UserCalendarConnectionRepository>();
        services.AddScoped<IAppointmentCalendarEventRepository, AppointmentCalendarEventRepository>();

        // Session Management - for concurrent session control
        services.AddScoped<ISessionManager, SessionManager>();

        // Calendar Integration Services
        services.AddSingleton<ITokenEncryptionService, TokenEncryptionService>();
        services.AddScoped<ICalendarServiceFactory, CalendarServiceFactory>();
        services.AddHttpClient<GoogleCalendarService>();
        services.AddHttpClient<MicrosoftCalendarService>();
        services.AddHttpClient<AppleCalendarService>();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<ISkillServiceClient, SkillServiceClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();

        // Register orchestration services
        // services.AddScoped<UserService.Application.Services.Orchestration.IUserDataEnrichmentService, UserService.Application.Services.Orchestration.UserDataEnrichmentService>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration, environment);

        services.AddDatabaseContext<UserDbContext>(
            configuration,
            serviceName,
            "UserService.Infrastructure");

        services.AddEventSourcing("UserServiceEventStore");

        var applicationAssembly = Assembly.Load("UserService.Application");
        services.AddCQRS(applicationAssembly);

        services.AddMessaging(
            configuration,
            Assembly.GetExecutingAssembly());

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        // Background Services for cleanup tasks
        services.AddHostedService<SessionCleanupBackgroundService>();
        services.AddHostedService<TokenCleanupBackgroundService>();
        // NOTE: LoginAttemptsCleanupBackgroundService removed - rate limiting is now handled
        // by DistributedRateLimitingMiddleware in Gateway with Redis-backed storage

        return services;
    }
}

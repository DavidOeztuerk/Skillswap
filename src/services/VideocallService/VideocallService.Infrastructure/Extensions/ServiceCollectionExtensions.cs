using System.Reflection;
using CQRS.Extensions;
using EventSourcing;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Security;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Services;
using VideocallService.Infrastructure.HttpClients;
using VideocallService.Infrastructure.Repositories;
using VideocallService.Infrastructure.Data;
using VideocallService.Infrastructure.BackgroundServices;
using VideocallService.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

namespace VideocallService.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment, string serviceName)
    {
        // Register Unit of Work and Repositories
        services.AddScoped<IVideocallUnitOfWork, VideocallUnitOfWork>();
        services.AddScoped<IVideoCallSessionRepository, VideoCallSessionRepository>();
        services.AddScoped<ICallParticipantRepository, CallParticipantRepository>();
        services.AddScoped<IE2EEAuditLogRepository, E2EEAuditLogRepository>();

        // Register E2EE Rate Limiter (Singleton - uses Redis)
        services.AddSingleton<IE2EERateLimiter, RedisE2EERateLimiter>();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<IAppointmentServiceClient, AppointmentServiceClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration, environment);

        services.AddDatabaseContext<VideoCallDbContext>(
            configuration, 
            serviceName);

        services.AddEventSourcing("VideocallServiceEventStore");

        // CRITICAL FIX: Register CQRS handlers from Application layer, not Infrastructure layer!
        var applicationAssembly = Assembly.Load("VideocallService.Application");
        services.AddCQRS(applicationAssembly);

        services.AddMessaging(
            configuration,
            applicationAssembly);

        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = environment.EnvironmentName == "Development";
            options.MaximumReceiveMessageSize = 1024 * 1024;
            options.StreamBufferCapacity = 10;
        });

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        // PHASE 2.2: Background services for cleanup and maintenance
        services.AddHostedService<CallCleanupBackgroundService>();

        return services;
    }
}

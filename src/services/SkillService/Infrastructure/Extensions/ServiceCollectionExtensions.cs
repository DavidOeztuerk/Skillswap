using MediatR;
using SkillService.Application.EventHandlers;
using Events.Integration.UserManagement;
using Infrastructure.Extensions;
using EventSourcing;
using CQRS.Extensions;
using System.Reflection;
using Infrastructure.Security;
using Infrastructure.Authorization;
using SkillService.Infrastructure.HttpClients;

namespace SkillService.Infrastructure.Extensions;

/// <summary>
/// Dependency injection configuration for SkillService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds SkillService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string serviceName)
    {
        services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration);

        services.AddDatabaseContext<SkillDbContext>(
            configuration,
            serviceName);

        services.AddEventSourcing("SkillServiceEventStore");

        services.AddCQRS(Assembly.GetExecutingAssembly());

        services.AddMessaging(
            configuration,
            Assembly.GetExecutingAssembly());

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        return services;
    }
}

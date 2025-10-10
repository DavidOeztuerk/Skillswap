using MediatR;
using MatchmakingService.Application.EventHandlers;
using Events.Integration.UserManagement;
using Events.Domain.Skill;
using Infrastructure.Extensions;
using EventSourcing;
using CQRS.Extensions;
using System.Reflection;
using MatchmakingService.Infrastructure.HttpClients;
using Infrastructure.Security;
using Infrastructure.Authorization;

namespace MatchmakingService.Extensions;

/// <summary>
/// Dependency injection configuration for MatchmakingService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds MatchmakingService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddInfrastructure(
         this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string serviceName)
    {
        // Register cascading delete event handlers
        services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();
        services.AddScoped<INotificationHandler<SkillDeletedDomainEvent>, SkillDeletedIntegrationEventHandler>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration);

        services.AddDatabaseContext<MatchmakingDbContext>(
            configuration, 
            serviceName);

        services.AddEventSourcing("MatchmakingServiceEventStore");

        services.AddCQRS(Assembly.GetExecutingAssembly());

        services.AddMessaging(
            configuration,
            Assembly.GetExecutingAssembly());

        services.AddHttpContextAccessor();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<ISkillServiceClient, SkillServiceClient>();

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        return services;
    }
}
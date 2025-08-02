using MediatR;
using MatchmakingService.Application.EventHandlers;
using Events.Integration.UserManagement;
using Events.Domain.Skill;

namespace MatchmakingService.Extensions;

/// <summary>
/// Dependency injection configuration for MatchmakingService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds MatchmakingService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddMatchmakingServiceDependencies(this IServiceCollection services)
    {
        // Register cascading delete event handlers
        services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();
        services.AddScoped<INotificationHandler<SkillDeletedDomainEvent>, SkillDeletedIntegrationEventHandler>();

        return services;
    }
}
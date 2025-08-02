using MediatR;
using SkillService.Application.EventHandlers;
using Events.Integration.UserManagement;

namespace SkillService.Extensions;

/// <summary>
/// Dependency injection configuration for SkillService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds SkillService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddSkillServiceDependencies(this IServiceCollection services)
    {
        // Register cascading delete event handlers
        services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();

        return services;
    }
}
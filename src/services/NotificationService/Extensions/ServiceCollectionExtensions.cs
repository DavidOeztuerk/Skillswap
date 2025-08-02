using MediatR;
using NotificationService.Application.EventHandlers;
using Events.Integration.UserManagement;

namespace NotificationService.Extensions;

/// <summary>
/// Dependency injection configuration for NotificationService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds NotificationService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddNotificationServiceDependencies(this IServiceCollection services)
    {
        // Register cascading delete event handlers
        services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();

        return services;
    }
}
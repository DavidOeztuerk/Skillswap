
using MediatR;
using AppointmentService.Application.EventHandlers;
using Events.Integration.UserManagement;
using Events.Domain.Skill;
using Events.Domain.Matchmaking;

namespace AppointmentService.Extensions;

/// <summary>
/// Dependency injection configuration for AppointmentService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds AppointmentService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddAppointmentServiceDependencies(this IServiceCollection services)
    {
        // Register cascading delete event handlers
        services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();
        services.AddScoped<INotificationHandler<SkillDeletedDomainEvent>, SkillDeletedIntegrationEventHandler>();
        services.AddScoped<INotificationHandler<MatchDeletedDomainEvent>, MatchDeletedIntegrationEventHandler>();

        return services;
    }
}
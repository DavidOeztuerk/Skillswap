using MediatR;
using AppointmentService.Application.EventHandlers;
using AppointmentService.Application.Services;
using AppointmentService.Infrastructure.Services;
using Events.Integration.UserManagement;
using Events.Domain.Skill;
using Events.Domain.Matchmaking;
using Infrastructure.Extensions;
using EventSourcing;
using CQRS.Extensions;
using System.Reflection;
using Infrastructure.Security;
using Infrastructure.Authorization;

namespace AppointmentService.Infrastructure.Extensions;

/// <summary>
/// Dependency injection configuration for AppointmentService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds AppointmentService-specific dependencies to the DI container
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
        services.AddScoped<INotificationHandler<MatchDeletedDomainEvent>, MatchDeletedIntegrationEventHandler>();

        // Register Meeting Link Service
        services.AddScoped<IMeetingLinkService, MeetingLinkService>();

        services.AddScoped<IAppointmentDataEnrichmentService, AppointmentDataEnrichmentService>();

        // Add service-specific dependencies
        // services.AddScoped<ISchedulingService, SchedulingService>();
        // services.AddScoped<IConflictResolutionService, ConflictResolutionService>();
        // services.AddScoped<INotificationProxy, NotificationProxy>();

        // Configure HttpClients for other services
        services.AddHttpClient("VideocallService", client =>
        {
            client.BaseAddress = new Uri("http://videocallservice:5006");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient("UserService", client =>
        {
            client.BaseAddress = new Uri("http://userservice:5001");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient("SkillService", client =>
        {
            client.BaseAddress = new Uri("http://skillservice:5002");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration);

        services.AddDatabaseContext<AppointmentDbContext>(
            configuration, 
            serviceName);

        services.AddEventSourcing("AppointmentServiceEventStore");

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


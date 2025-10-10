using MediatR;
using AppointmentService.Application.EventHandlers;
using AppointmentService.Application.Services;
using AppointmentService.Infrastructure.Services;
using AppointmentService.Infrastructure.HttpClients;
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

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<ISkillServiceClient, SkillServiceClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();

        // Named HttpClients used by AppointmentDataEnrichmentService
        services.AddHttpClient("UserService", client =>
        {
            var userServiceUrl = Environment.GetEnvironmentVariable("USER_SERVICE_URL")
                ?? configuration["Services:UserService:Url"]
                ?? "http://gateway:8080/api/users";
            client.BaseAddress = new Uri(userServiceUrl);
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient("SkillService", client =>
        {
            var skillServiceUrl = Environment.GetEnvironmentVariable("SKILL_SERVICE_URL")
                ?? configuration["Services:SkillService:Url"]
                ?? "http://gateway:8080/api/skills";
            client.BaseAddress = new Uri(skillServiceUrl);
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // Register orchestration services
        // services.AddScoped<AppointmentService.Application.Services.Orchestration.IAppointmentDataEnrichmentService,
        //     AppointmentService.Application.Services.Orchestration.AppointmentDataEnrichmentService>();

        // Add service-specific dependencies
        // services.AddScoped<ISchedulingService, SchedulingService>();
        // services.AddScoped<IConflictResolutionService, ConflictResolutionService>();
        // services.AddScoped<INotificationProxy, NotificationProxy>();

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

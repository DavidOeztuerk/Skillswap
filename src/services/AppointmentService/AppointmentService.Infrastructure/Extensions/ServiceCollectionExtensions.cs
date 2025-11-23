using MediatR;
using AppointmentService.Application.Services;
using AppointmentService.Infrastructure.Services;
using AppointmentService.Infrastructure.HttpClients;
using AppointmentService.Infrastructure.Data;
using AppointmentService.Infrastructure.Repositories;
using AppointmentService.Infrastructure.BackgroundServices;
using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
using Events.Integration.UserManagement;
using Events.Domain.Skill;
using Events.Domain.Matchmaking;
using Infrastructure.Extensions;
using EventSourcing;
using CQRS.Extensions;
using System.Reflection;
using Infrastructure.Security;
using Infrastructure.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

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
        // Event handlers are auto-discovered by AddMessaging() below
        // No need to explicitly register them here

        // Register service implementations
        // Interfaces are now in Domain layer, so we can directly register them without circular dependency
        services.AddScoped<IMeetingLinkService, MeetingLinkService>();
        services.AddScoped<ISessionOrchestrationService, SessionOrchestrationService>();
        services.AddScoped<IAppointmentDataEnrichmentService, AppointmentDataEnrichmentService>();
        services.AddScoped<IStripePaymentService, StripePaymentService>();

        // Register scheduling and availability services
        services.AddScoped<IPreferredTimeParser, PreferredTimeParser>();
        services.AddScoped<IAvailabilityCheckService, AvailabilityCheckService>();
        services.AddScoped<IAppointmentSchedulingAlgorithm, AppointmentSchedulingAlgorithm>();
        services.AddScoped<IAvailableSlotFinderService, AvailableSlotFinderService>();

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

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration, environment);

        services.AddDatabaseContext<AppointmentDbContext>(
            configuration,
            serviceName,
            "AppointmentService.Infrastructure");

        // Register Unit of Work and Repositories
        services.AddScoped<IAppointmentUnitOfWork, AppointmentUnitOfWork>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<ISessionAppointmentRepository, SessionAppointmentRepository>();
        services.AddScoped<ISessionSeriesRepository, SessionSeriesRepository>();
        services.AddScoped<ISessionRatingRepository, SessionRatingRepository>();
        services.AddScoped<ISessionPaymentRepository, SessionPaymentRepository>();
        services.AddScoped<IConnectionRepository, ConnectionRepository>();

        services.AddEventSourcing("AppointmentServiceEventStore");

        // IMPORTANT: Load CQRS handlers from Application assembly, not Infrastructure
        var applicationAssembly = Assembly.Load("AppointmentService.Application");
        services.AddCQRS(applicationAssembly);

        // CRITICAL FIX: Event consumers (handlers) are in Application assembly!
        services.AddMessaging(
            configuration,
            applicationAssembly);  // Use Application assembly for event handlers

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        // Register Background Services
        services.AddHostedService<AppointmentReminderScheduler>();

        return services;
    }
}

using MediatR;
using MatchmakingService.Application.EventHandlers;
using Events.Integration.UserManagement;
using Events.Domain.Skill;
using Infrastructure.Extensions;
using EventSourcing;
using CQRS.Extensions;
using System.Reflection;
using MatchmakingService.Infrastructure.HttpClients;
using MatchmakingService.Infrastructure.Repositories;
using MatchmakingService.Infrastructure.Services;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Infrastructure.Security;
using Infrastructure.Authorization;
using MatchmakingService.Infrastructure.Data;

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

        services.AddJwtAuthentication(configuration, environment);

        services.AddDatabaseContext<MatchmakingDbContext>(
            configuration,
            serviceName,
            "MatchmakingService.Infrastructure");

        services.AddEventSourcing("MatchmakingServiceEventStore");

        // CRITICAL FIX: Register CQRS handlers from Application layer, not API layer!
        services.AddCQRS(typeof(MatchmakingService.Application.Queries.GetUserMatchesQuery).Assembly);

        services.AddMessaging(
            configuration,
            typeof(MatchmakingService.Application.Queries.GetUserMatchesQuery).Assembly);

        services.AddHttpContextAccessor();

        // Register Unit of Work and Repositories
        services.AddScoped<IMatchmakingUnitOfWork, MatchmakingUnitOfWork>();
        services.AddScoped<IMatchRepository, MatchRepository>();
        services.AddScoped<IMatchRequestRepository, MatchRequestRepository>();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<ISkillServiceClient, SkillServiceClient>();
        services.AddScoped<ISkillLookupService, SkillLookupService>();

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        return services;
    }
}

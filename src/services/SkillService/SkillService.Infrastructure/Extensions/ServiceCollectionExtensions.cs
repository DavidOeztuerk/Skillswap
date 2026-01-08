using Infrastructure.Extensions;
using EventSourcing;
using CQRS.Extensions;
using System.Reflection;
using Infrastructure.Security;
using Infrastructure.Authorization;
using SkillService.Infrastructure.HttpClients;
using SkillService.Infrastructure.Repositories;
using SkillService.Infrastructure.Services;
using SkillService.Domain.Repositories;
using SkillService.Domain.Services;
using SkillService.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

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
        // Register Unit of Work and Repositories
        services.AddScoped<ISkillUnitOfWork, SkillUnitOfWork>();
        services.AddScoped<ISkillRepository, SkillRepository>();
        services.AddScoped<ISkillCategoryRepository, SkillCategoryRepository>();
        services.AddScoped<ISkillEndorsementRepository, SkillEndorsementRepository>();
        services.AddScoped<ISkillMatchRepository, SkillMatchRepository>();
        services.AddScoped<ISkillResourceRepository, SkillResourceRepository>();
        services.AddScoped<ISkillReviewRepository, SkillReviewRepository>();
        services.AddScoped<ISkillViewRepository, SkillViewRepository>();

        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();

        // Register Location Service for geocoding and distance calculations
        services.AddHttpClient<ILocationService, LocationService>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration, environment);

        services.AddDatabaseContext<SkillDbContext>(
            configuration,
            serviceName,
            "SkillService.Infrastructure");

        services.AddEventSourcing("SkillServiceEventStore");

        // Load Application assembly for CQRS handlers
        var applicationAssembly = Assembly.Load("SkillService.Application");
        services.AddCQRS(applicationAssembly);

        // CRITICAL FIX: Use Application assembly for messaging as well
        services.AddMessaging(
            configuration,
            applicationAssembly);

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        return services;
    }
}

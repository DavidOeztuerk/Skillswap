//using MatchmakingService.Application.Mappers;

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
        // Register contract mappers
        //services.AddScoped<IMatchmakingContractMapper, MatchmakingContractMapper>();

        return services;
    }
}
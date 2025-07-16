using SkillService.Application.Mappers;

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
        // Register contract mappers
        services.AddScoped<ISkillContractMapper, SkillContractMapper>();

        return services;
    }
}
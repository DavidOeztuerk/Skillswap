namespace UserService.Api.Extensions;

/// <summary>
/// Dependency injection configuration for UserService
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds UserService-specific dependencies to the DI container
    /// </summary>
    public static IServiceCollection AddUserServiceDependencies(this IServiceCollection services)
    {
        return services;
    }
}
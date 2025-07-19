
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
        // Register contract mappers
        //services.AddScoped<IAppointmentContractMapper, AppointmentContractMapper>();

        return services;
    }
}
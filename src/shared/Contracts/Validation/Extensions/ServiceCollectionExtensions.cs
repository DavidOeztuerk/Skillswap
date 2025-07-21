using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Contracts.Validation.Extensions;

/// <summary>
/// Service registration extensions for contract validators
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers all FluentValidation validators from the current assembly
    /// </summary>
    public static IServiceCollection AddContractValidators(this IServiceCollection services)
    {
        // Register all validators from this assembly
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Add FluentValidation to ASP.NET Core automatically
        //services.AddFluentValidationAutoValidation();
        //services.AddFluentValidationClientsideAdapters();

        return services;
    }

    /// <summary>
    /// Registers validators from multiple assemblies
    /// </summary>
    public static IServiceCollection AddContractValidators(this IServiceCollection services, params Assembly[] assemblies)
    {
        foreach (var assembly in assemblies)
        {
            services.AddValidatorsFromAssembly(assembly);
        }

        //services.AddFluentValidationAutoValidation();
        //services.AddFluentValidationClientsideAdapters();

        return services;
    }
}
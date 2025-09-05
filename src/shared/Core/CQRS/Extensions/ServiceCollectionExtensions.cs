using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using CQRS.Behaviors;
using System.Reflection;

namespace CQRS.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds CQRS with Redis caching support and proper cache invalidation
    /// </summary>
    public static IServiceCollection AddCQRS(
        this IServiceCollection services,
        params Assembly[] assemblies)
    {
        // Add MediatR with all behaviors including cache invalidation
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblies(assemblies);

            // Add pipeline behaviors in order
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(CachingBehavior<,>)); // Caching BEFORE Performance measurement
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(CacheInvalidationBehavior<,>)); // Invalidation AFTER execution
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(AuditBehavior<,>));
        });

        // Add FluentValidation
        services.AddValidatorsFromAssemblies(assemblies);

        return services;
    }
}

using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using CQRS.Behaviors;
using System.Reflection;
using Microsoft.Extensions.Caching.Distributed;

namespace CQRS.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds CQRS infrastructure to the DI container
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="assemblies">Assemblies to scan for handlers and validators</param>
    /// <returns>Service collection</returns>
    public static IServiceCollection AddCQRS(this IServiceCollection services, params Assembly[] assemblies)
    {
        // Add MediatR
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblies(assemblies);
            // Add pipeline behaviors in order
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(CachingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(AuditBehavior<,>));
        });

        // Add FluentValidation
        services.AddValidatorsFromAssemblies(assemblies);

        // Add AutoMapper if needed
        services.AddAutoMapper(assemblies);

        return services;
    }

    /// <summary>
    /// Adds CQRS with caching support (Redis + MemoryCache fallback)
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Configuration</param>
    /// <param name="assemblies">Assemblies to scan</param>
    /// <returns>Service collection</returns>
    public static IServiceCollection AddCQRSWithCaching(this IServiceCollection services, IConfiguration configuration, params Assembly[] assemblies)
    {
        // Add memory cache as fallback
        services.AddMemoryCache();

        // Get Redis connection string from configuration
        var redisConnectionString = configuration.GetConnectionString("Redis")
                                  ?? configuration["Redis:ConnectionString"]
                                  ?? configuration["REDIS_CONNECTION_STRING"]
                                  ?? Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING");

        Console.WriteLine($"[DEBUG] Redis Connection String: '{redisConnectionString}'");

        // IMMER MemoryDistributedCache als Fallback registrieren
        services.AddSingleton<IDistributedCache, MemoryDistributedCache>();

        // Add Redis cache only if connection string is available - ÜBERSCHREIBT MemoryDistributedCache
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            Console.WriteLine($"[DEBUG] Configuring Redis with: {redisConnectionString}");
            try
            {
                services.AddStackExchangeRedisCache(options =>
                {
                    options.Configuration = redisConnectionString;
                    options.InstanceName = "UserService";
                });
                Console.WriteLine("[DEBUG] Redis cache configured successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Redis configuration failed: {ex.Message}");
                // MemoryDistributedCache bleibt als Fallback bestehen
            }
        }
        else
        {
            Console.WriteLine("[DEBUG] No Redis connection string found, using MemoryDistributedCache");
        }

        return services.AddCQRS(assemblies);
    }

    /// <summary>
    /// Adds CQRS with explicit Redis configuration
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="redisConnectionString">Redis connection string</param>
    /// <param name="assemblies">Assemblies to scan</param>
    /// <returns>Service collection</returns>
    public static IServiceCollection AddCQRSWithRedis(this IServiceCollection services, string redisConnectionString, params Assembly[] assemblies)
    {
        // Add memory cache as fallback
        services.AddMemoryCache();

        // Add Redis cache
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = "UserService";
            });
        }

        return services.AddCQRS(assemblies);
    }
}
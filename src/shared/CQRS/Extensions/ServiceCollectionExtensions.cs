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
    /// Adds CQRS infrastructure 
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

        // Add Redis cache only if connection string is available
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            Console.WriteLine($"[DEBUG] Configuring Redis with: {redisConnectionString}");
            try
            {
                // NUR EINE Redis-Konfiguration - der Service-Name wird durch InstanceName unterschieden
                var currentServiceName = GetCurrentServiceName();

                services.RemoveAll<IDistributedCache>();
                services.AddStackExchangeRedisCache(options =>
                {
                    options.Configuration = redisConnectionString;
                    options.InstanceName = currentServiceName; // Automatisch erkannter Service-Name
                    options.ConfigurationOptions = new StackExchange.Redis.ConfigurationOptions
                    {
                        EndPoints = { redisConnectionString },
                        ConnectTimeout = 5000,
                        SyncTimeout = 5000,
                        AsyncTimeout = 5000,
                        ConnectRetry = 3,
                        AbortOnConnectFail = false, // WICHTIG: Nicht abbrechen bei Fehlern
                        AllowAdmin = false
                    };
                });
                Console.WriteLine($"[DEBUG] Redis cache configured successfully for {currentServiceName}");
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

        // WICHTIG: Verwende CQRS mit Caching-Behaviors
        return services.AddCQRSWithCachingBehaviors(assemblies);
    }

    /// <summary>
    /// Adds CQRS WITH caching behaviors (nur intern verwendet)
    /// </summary>
    private static IServiceCollection AddCQRSWithCachingBehaviors(this IServiceCollection services, params Assembly[] assemblies)
    {
        // Add MediatR mit Caching
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
    /// Adds CQRS without any caching (for development/debugging)
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="assemblies">Assemblies to scan</param>
    /// <returns>Service collection</returns>
    public static IServiceCollection AddCQRSWithoutCaching(this IServiceCollection services, params Assembly[] assemblies)
    {
        // Add memory cache only
        services.AddMemoryCache();
        services.AddSingleton<IDistributedCache, MemoryDistributedCache>();

        return services.AddCQRS(assemblies); // Verwendet die Version OHNE CachingBehavior
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
        services.AddSingleton<IDistributedCache, MemoryDistributedCache>();

        // Add Redis cache if available
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            try
            {
                var currentServiceName = GetCurrentServiceName();

                services.RemoveAll<IDistributedCache>();
                services.AddStackExchangeRedisCache(options =>
                {
                    options.Configuration = redisConnectionString;
                    options.InstanceName = currentServiceName;
                    options.ConfigurationOptions = new StackExchange.Redis.ConfigurationOptions
                    {
                        EndPoints = { redisConnectionString },
                        ConnectTimeout = 5000,
                        SyncTimeout = 5000,
                        AsyncTimeout = 5000,
                        ConnectRetry = 3,
                        AbortOnConnectFail = false
                    };
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Redis configuration failed: {ex.Message}, using MemoryCache");
                // MemoryDistributedCache bleibt bestehen
            }
        }

        return services.AddCQRSWithCachingBehaviors(assemblies);
    }

    /// <summary>
    /// Helper method to remove all services of a specific type
    /// </summary>
    private static IServiceCollection RemoveAll<T>(this IServiceCollection services)
    {
        var serviceType = typeof(T);
        var servicesToRemove = services.Where(s => s.ServiceType == serviceType).ToList();
        foreach (var service in servicesToRemove)
        {
            services.Remove(service);
        }
        return services;
    }

    /// <summary>
    /// Automatically detects the current service name from assembly
    /// </summary>
    private static string GetCurrentServiceName()
    {
        var assembly = Assembly.GetEntryAssembly();
        var assemblyName = assembly?.GetName().Name ?? "UnknownService";

        // Extrahiere Service-Namen aus Assembly-Namen
        if (assemblyName.Contains("UserService")) return "UserService";
        if (assemblyName.Contains("SkillService")) return "SkillService";
        if (assemblyName.Contains("NotificationService")) return "NotificationService";
        if (assemblyName.Contains("MatchmakingService")) return "MatchmakingService";
        if (assemblyName.Contains("AppointmentService")) return "AppointmentService";
        if (assemblyName.Contains("VideocallService")) return "VideocallService";

        return assemblyName; // Fallback zum Assembly-Namen
    }
}
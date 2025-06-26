using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using CQRS.Behaviors;
using CQRS.Services;
using System.Reflection;
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;

namespace CQRS.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds CQRS with Redis caching support and proper cache invalidation
    /// </summary>
    public static IServiceCollection AddCQRSWithRedis(this IServiceCollection services, string redisConnectionString, params Assembly[] assemblies)
    {
        // Add memory cache as fallback
        services.AddMemoryCache();

        // Configure Redis if connection string is provided
        IConnectionMultiplexer? connectionMultiplexer = null;
        bool useRedis = false;

        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            try
            {
                // Configure Redis with retry logic
                var configOptions = ConfigurationOptions.Parse(redisConnectionString);
                configOptions.ConnectTimeout = 5000;
                configOptions.SyncTimeout = 5000;
                configOptions.AsyncTimeout = 5000;
                configOptions.ConnectRetry = 3;
                configOptions.AbortOnConnectFail = false;
                configOptions.KeepAlive = 60;

                // Enable command statistics for monitoring
                configOptions.AllowAdmin = true;

                connectionMultiplexer = ConnectionMultiplexer.Connect(configOptions);

                // Register ConnectionMultiplexer as singleton
                services.AddSingleton(connectionMultiplexer);

                // Add Redis cache
                services.AddStackExchangeRedisCache(options =>
                {
                    options.ConnectionMultiplexerFactory = () => Task.FromResult(connectionMultiplexer);
                    options.InstanceName = GetCurrentServiceName() + ":";
                });

                useRedis = true;
                Console.WriteLine($"[DEBUG] Redis cache configured successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Redis configuration failed: {ex.Message}, using MemoryCache");
                services.AddSingleton<IDistributedCache, MemoryDistributedCache>();
            }
        }
        else
        {
            Console.WriteLine("[DEBUG] No Redis connection string found, using MemoryDistributedCache");
            services.AddSingleton<IDistributedCache, MemoryDistributedCache>();
        }

        // Register appropriate cache invalidation service
        if (useRedis)
        {
            services.AddSingleton<ICacheInvalidationService, RedisCacheInvalidationService>();
        }
        else
        {
            services.AddSingleton<ICacheInvalidationService, MemoryCacheInvalidationService>();
        }

        // Add MediatR with all behaviors including cache invalidation
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblies(assemblies);

            // Add pipeline behaviors in order
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(RedisCachingBehavior<,>)); // Redis-aware caching
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(CacheInvalidationBehavior<,>)); // Cache invalidation
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(AuditBehavior<,>));
        });

        // Add FluentValidation
        services.AddValidatorsFromAssemblies(assemblies);

        // Add AutoMapper if needed
        services.AddAutoMapper(assemblies);

        return services;
    }

    /// <summary>
    /// Gets the current service name from assembly
    /// </summary>
    private static string GetCurrentServiceName()
    {
        var assembly = Assembly.GetEntryAssembly();
        var assemblyName = assembly?.GetName().Name ?? "UnknownService";

        if (assemblyName.Contains("UserService")) return "UserService";
        if (assemblyName.Contains("SkillService")) return "SkillService";
        if (assemblyName.Contains("NotificationService")) return "NotificationService";
        if (assemblyName.Contains("MatchmakingService")) return "MatchmakingService";
        if (assemblyName.Contains("AppointmentService")) return "AppointmentService";
        if (assemblyName.Contains("VideocallService")) return "VideocallService";

        return assemblyName;
    }
}
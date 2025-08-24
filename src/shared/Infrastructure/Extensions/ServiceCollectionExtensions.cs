using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Infrastructure.Middleware;
using Infrastructure.Logging;
using Infrastructure.Observability;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Serilog;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Json;
using StackExchange.Redis;
using System.Reflection;
using Microsoft.Extensions.Caching.Distributed;
using Infrastructure.Security;

namespace Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds all infrastructure services and middleware to the DI container
    /// </summary>
    public static IServiceCollection AddSharedInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment,
        string serviceName)
    {
        services.AddScoped<IJwtService, JwtService>();
        services.AddSingleton<ITotpService, TotpService>();
        
        // Add Token Revocation Service - use Redis if available, otherwise in-memory
        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            // Register Redis-based token revocation (reuse existing connection multiplexer)
            services.AddSingleton<ITokenRevocationService>(provider =>
            {
                var multiplexer = provider.GetService<IConnectionMultiplexer>();
                if (multiplexer == null)
                {
                    // If not yet registered, create it
                    multiplexer = ConnectionMultiplexer.Connect(redisConnectionString);
                }
                var logger = provider.GetRequiredService<ILogger<RedisTokenRevocationService>>();
                return new RedisTokenRevocationService(multiplexer, logger);
            });
        }
        else
        {
            // Fallback to in-memory token revocation
            services.AddSingleton<ITokenRevocationService, InMemoryTokenRevocationService>();
        }

        // Configure Serilog
        LoggingConfiguration.ConfigureSerilog(configuration, environment, serviceName);
        services.AddSerilog();

        // Add health checks
        services.AddHealthChecks();

        // Configure JSON serialization for APIs to use camelCase
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.WriteIndented = environment.IsDevelopment();
        });

        // Also configure for traditional controllers (if any)
        services.Configure<JsonOptions>(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.WriteIndented = environment.IsDevelopment();
        });

        // Add HTTP context accessor for correlation ID
        services.AddHttpContextAccessor();

        // Add telemetry and performance monitoring
        services
            .AddTelemetry(serviceName, "1.0.0", builder => builder
            .AddTracing()
            .AddMetrics());

        services.AddSingleton<IPerformanceMetrics, PerformanceMetrics>();
        services.AddSingleton<IPerformanceMonitoringService, PerformanceMonitoringService>();

        // Add CORS with secure defaults
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                    ?? new[] { "http://localhost:3000" };

                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        return services;
    }

    /// <summary>
    /// Configures the middleware pipeline with all infrastructure components
    /// </summary>
    public static IApplicationBuilder UseSharedInfrastructure(
        this IApplicationBuilder app)
    {
        // Security headers (should be first)
        app.UseMiddleware<SecurityHeadersMiddleware>();

        // Request logging (after correlation ID)
        app.UseMiddleware<RequestLoggingMiddleware>();

        // Global exception handling (should catch all exceptions)
        app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

        // Add Serilog request logging
        app.UseSerilogRequestLogging(options =>
        {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value ?? "");
                diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.FirstOrDefault() ?? "");
                diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "");

                if (httpContext.User?.Identity?.IsAuthenticated == true)
                {
                    diagnosticContext.Set("UserId", httpContext.User.FindFirst("sub")?.Value ?? "");
                }
            };
        });

        // CORS
        app.UseCors();

        // Telemetry and performance monitoring
        app.UseTelemetry().UseCorrelationId().UsePerformancee();
        app.UseOpenTelemetryPrometheusScrapingEndpoint();

        // Health checks endpoint
        app.UseHealthChecks("/health");

        return app;
    }

    /// <summary>
    /// Adds CQRS with Redis caching support and proper cache invalidation
    /// </summary>
    public static IServiceCollection AddCaching(
        this IServiceCollection services,
        string redisConnectionString)
    {
        // für Rate limiting 
        services.AddMemoryCache();

        // Configure Redis if connection string is provided
        IConnectionMultiplexer? connectionMultiplexer = null;

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

        return services;
    }

    /// <summary>
    /// Gets the current service name from assembly
    /// </summary>
    private static string GetCurrentServiceName()
    {
        var assembly = Assembly.GetEntryAssembly();
        var assemblyName = assembly?.GetName().Name ?? "UnknownService";

        if (assemblyName.Contains("UserService")) return "userservice";
        if (assemblyName.Contains("SkillService")) return "skillservice";
        if (assemblyName.Contains("NotificationService")) return "notificationservice";
        if (assemblyName.Contains("MatchmakingService")) return "matchmakingservice";
        if (assemblyName.Contains("AppointmentService")) return "appointmentservice";
        if (assemblyName.Contains("VideocallService")) return "videocallservice";

        return assemblyName;
    }
}

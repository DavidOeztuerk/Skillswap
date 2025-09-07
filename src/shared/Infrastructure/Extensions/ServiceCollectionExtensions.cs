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
using Infrastructure.Resilience;
using Infrastructure.Security.Encryption;
using Infrastructure.Security.InputSanitization;
using Infrastructure.HealthChecks;
using Infrastructure.Caching;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Infrastructure.Models;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Core.Common.Exceptions;

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
        // Core Security Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddSingleton<ITotpService, TotpService>();
        
        // Error Handling Services
        services.AddSingleton<IErrorMessageService, ErrorMessageService>();
        
        // Add Token Revocation Service - use Redis if available, otherwise in-memory
        var redisConnectionString = configuration.GetConnectionString("Redis") 
            ?? configuration["Redis:ConnectionString"];
            
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

        // Add Swagger Documentation
        services.AddEndpointsApiExplorer();
        services.AddSwaggerDocumentation(serviceName);

        // Add Resilience patterns (Circuit Breaker, Retry)
        services.AddResilience();

        // Add Security Services
        services.AddSecretManagement(configuration);
        services.AddSecurityAuditLogging();
        
        // Add Data Encryption
        services.AddDataEncryption(configuration);
        
        // Add Input Sanitization
        services.AddInputSanitization(configuration);
        
        // Add Distributed Rate Limiting
        services.AddDistributedRateLimiting(configuration);

        // Add Comprehensive Health Checks
        services.AddHealthChecks();
        
        // Skip ServiceCommunicationManager for Gateway (doesn't need service-to-service communication)
        if (!serviceName.Equals("Gateway", StringComparison.OrdinalIgnoreCase))
        {
            services.AddComprehensiveHealthChecks(configuration);
        }

        // Add Caching with Redis or fallback to Memory
        services.AddCaching(redisConnectionString ?? string.Empty);
        
        // Add Caching Services
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            services.AddSingleton<IDistributedCacheService, RedisDistributedCacheService>();
            services.AddSingleton<IDistributedRateLimitStore, RedisDistributedRateLimitStore>();
        }
        else
        {
            services.AddSingleton<IDistributedRateLimitStore, InMemoryRateLimitStore>();
        }
        // Skip CacheInvalidationService for Gateway (doesn't need cache invalidation)
        if (!serviceName.Equals("Gateway", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<CacheInvalidationService>();
        }

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
        this IApplicationBuilder app,
        IHostEnvironment environment,
        string serviceName)
    {
        // Security headers (should be first)
        app.UseMiddleware<SecurityHeadersMiddleware>();

        // Correlation ID (should be early in pipeline)
        app.UseMiddleware<CorrelationIdMiddleware>();

        // Request logging (after correlation ID)
        app.UseMiddleware<RequestLoggingMiddleware>();
        
        // Telemetry and performance monitoring (before exception handling to capture correct status codes)
        app.UseTelemetry();
        app.UsePerformanceMonitoring();

        // Global exception handling (should catch all exceptions)
        app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

        // Input Sanitization (after exception handling)
        app.UseMiddleware<InputSanitizationMiddleware>();

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

        // Swagger in Development
        if (environment.IsDevelopment())
        {
            app.UseSwaggerDocumentation(serviceName);
        }

        // Rate Limiting Middleware
        app.UseMiddleware<DistributedRateLimitingMiddleware>();
        app.UseOpenTelemetryPrometheusScrapingEndpoint();

        // Configure health check endpoints
        ConfigureHealthCheckEndpoints(app);

        app.UseAuthentication();
        app.UseAuthorization();
        
        // Security Audit (after authentication to track user actions)
        app.UseMiddleware<SecurityAuditMiddleware>();
        
        app.UsePermissionMiddleware();

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

                // Register ConnectionMultiplexer as singleton for all services to use
                services.AddSingleton<IConnectionMultiplexer>(connectionMultiplexer);
                services.AddSingleton(connectionMultiplexer);

                // Add Redis cache
                services.AddStackExchangeRedisCache(options =>
                {
                    options.ConnectionMultiplexerFactory = () => Task.FromResult(connectionMultiplexer);
                    options.InstanceName = GetCurrentServiceName() + ":";
                });

                // Add Redis health check
                services.AddHealthChecks()
                    .AddRedis(redisConnectionString, 
                        name: "redis", 
                        tags: new[] { "ready", "cache" },
                        timeout: TimeSpan.FromSeconds(2));

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
    /// Adds JWT Authentication with complete configuration
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        services.Configure<JwtSettings>(jwtSettings);
        
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? jwtSettings["Secret"]
            ?? throw new ConfigurationException("JWT_SECRET", "JwtSettings", "JWT Secret not configured. Please set JWT_SECRET environment variable or configure JwtSettings:Secret");
            
        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? jwtSettings["Issuer"]
            ?? throw new ConfigurationException("JWT_ISSUER", "JwtSettings", "JWT Issuer not configured. Please set JWT_ISSUER environment variable or configure JwtSettings:Issuer");
            
        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? jwtSettings["Audience"]
            ?? throw new ConfigurationException("JWT_AUDIENCE", "JwtSettings", "JWT Audience not configured. Please set JWT_AUDIENCE environment variable or configure JwtSettings:Audience");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                opts.RequireHttpsMetadata = false;
                opts.SaveToken = true;
                opts.MapInboundClaims = false;

                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = JwtRegisteredClaimNames.Sub,
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };

                opts.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var tokenRevocationService = context.HttpContext.RequestServices
                            .GetRequiredService<ITokenRevocationService>();

                        var jti = context.Principal?.FindFirst("jti")?.Value;
                        if (!string.IsNullOrEmpty(jti))
                        {
                            var isRevoked = await tokenRevocationService.IsTokenRevokedAsync(jti);
                            if (isRevoked)
                            {
                                context.Fail("Token has been revoked");
                            }
                        }
                    },
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception is SecurityTokenExpiredException)
                            context.Response.Headers.Append("Token-Expired", "true");
                        return Task.CompletedTask;
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        var result = System.Text.Json.JsonSerializer.Serialize(new { 
                            error = "unauthorized", 
                            message = "You are not authorized to access this resource" 
                        });
                        await context.Response.WriteAsync(result);
                    }
                };
            });

        return services;
    }

    /// <summary>
    /// Configures health check endpoints with proper response formatting
    /// </summary>
    private static void ConfigureHealthCheckEndpoints(IApplicationBuilder app)
    {
        var healthCheckOptions = new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            ResponseWriter = async (context, report) =>
            {
                context.Response.ContentType = "application/json";
                var response = new
                {
                    status = report.Status.ToString(),
                    timestamp = DateTime.UtcNow,
                    durationMs = report.TotalDuration.TotalMilliseconds,
                    checks = report.Entries.Select(e => new
                    {
                        name = e.Key,
                        status = e.Value.Status.ToString(),
                        durationMs = e.Value.Duration.TotalMilliseconds,
                        tags = e.Value.Tags,
                        error = e.Value.Exception?.Message
                    })
                };
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(response, 
                    new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
            }
        };

        // General health endpoint
        app.UseHealthChecks("/health", healthCheckOptions);

        // Liveness probe - only checks if the service is alive
        app.UseHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            Predicate = r => r.Tags.Contains("live"),
            ResponseWriter = healthCheckOptions.ResponseWriter,
            ResultStatusCodes =
            {
                [HealthStatus.Healthy] = StatusCodes.Status200OK,
                [HealthStatus.Degraded] = StatusCodes.Status200OK,
                [HealthStatus.Unhealthy] = StatusCodes.Status200OK
            }
        });

        // Readiness probe - checks if the service is ready to handle requests
        app.UseHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            Predicate = r => r.Tags.Contains("ready"),
            ResponseWriter = healthCheckOptions.ResponseWriter,
            ResultStatusCodes =
            {
                [HealthStatus.Healthy] = StatusCodes.Status200OK,
                [HealthStatus.Degraded] = StatusCodes.Status503ServiceUnavailable,
                [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
            }
        });
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

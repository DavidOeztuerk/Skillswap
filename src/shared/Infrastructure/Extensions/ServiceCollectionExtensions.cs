using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Infrastructure.Middleware;
using Infrastructure.Logging;
using Infrastructure.Observability;
using Microsoft.Extensions.Configuration;
using Serilog;

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
        // Configure Serilog
        LoggingConfiguration.ConfigureSerilog(configuration, environment, serviceName);
        services.AddSerilog();

        // Add health checks
        services.AddHealthChecks();

        // Add HTTP context accessor for correlation ID
        services.AddHttpContextAccessor();

        // Add telemetry and performance monitoring
        services
            .AddTelemetry(serviceName, "1.0.0", builder => builder
                .AddTracing()
                .AddMetrics());
                // .AddLogging());

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
    public static IApplicationBuilder UseSharedInfrastructure(this IApplicationBuilder app)
    {
        // Security headers (should be first)
        app.UseMiddleware<SecurityHeadersMiddleware>();

        // Correlation ID (early in pipeline)
        app.UseMiddleware<Observability.CorrelationIdMiddleware>();

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
        app.UseTelemetry();
        app.UseMiddleware<PerformanceMiddleware>();
        app.UseOpenTelemetryPrometheusScrapingEndpoint();

        // Health checks endpoint
        app.UseHealthChecks("/health");

        return app;
    }
}

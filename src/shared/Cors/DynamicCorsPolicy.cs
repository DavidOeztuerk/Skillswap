using Microsoft.AspNetCore.Cors.Infrastructure;

namespace SkillSwap.Shared.Cors;

/// <summary>
/// Dynamic CORS policy that automatically allows Firebase Workstations
/// No need to update configuration for each new Workstation URL
/// </summary>
public class DynamicCorsPolicy
{
    public static void ConfigureCors(CorsOptions options)
    {
        options.AddPolicy("DynamicPolicy", builder =>
        {
            builder
                .WithOrigins(GetStaticAllowedOrigins())
                .SetIsOriginAllowed(IsOriginAllowed)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    }

    private static string[] GetStaticAllowedOrigins()
    {
        // Always allow local development
        return new[]
        {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173", // Vite dev server alternative port
            "https://localhost:3000",
            "https://127.0.0.1:3000"
        };
    }

    private static bool IsOriginAllowed(string origin)
    {
        // Allow all local development origins
        if (origin.StartsWith("http://localhost") || 
            origin.StartsWith("https://localhost") ||
            origin.StartsWith("http://127.0.0.1") || 
            origin.StartsWith("https://127.0.0.1"))
        {
            return true;
        }

        // Allow all Firebase Workstations
        if (origin.EndsWith(".cloudworkstations.dev"))
        {
            // Additional security: ensure it's a port 3000 frontend
            if (origin.Contains("3000-firebase-"))
            {
                return true;
            }
        }

        // Allow any other origins specified in environment
        var additionalOrigins = Environment.GetEnvironmentVariable("ADDITIONAL_CORS_ORIGINS");
        if (!string.IsNullOrEmpty(additionalOrigins))
        {
            var origins = additionalOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);
            return origins.Any(o => o.Trim().Equals(origin, StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }
}

/// <summary>
/// Extension methods for easy CORS setup
/// </summary>
public static class CorsExtensions
{
    public static IServiceCollection AddDynamicCors(this IServiceCollection services)
    {
        services.AddCors(DynamicCorsPolicy.ConfigureCors);
        return services;
    }

    public static IApplicationBuilder UseDynamicCors(this IApplicationBuilder app)
    {
        app.UseCors("DynamicPolicy");
        return app;
    }
}
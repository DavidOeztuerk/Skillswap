using Microsoft.AspNetCore.Http;

namespace SkillSwap.Shared.Cors;

/// <summary>
/// Middleware that automatically sets CORS headers for Firebase Workstations
/// No configuration needed - works with any Firebase Workstation URL
/// </summary>
public class AutoFirebaseCorsMiddleware
{
    private readonly RequestDelegate _next;

    public AutoFirebaseCorsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var origin = context.Request.Headers["Origin"].FirstOrDefault();

        if (!string.IsNullOrEmpty(origin))
        {
            // Check if origin should be allowed
            if (IsAllowedOrigin(origin))
            {
                // Set CORS headers
                context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
                context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
                context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With";
            }
        }

        // Handle preflight requests
        if (context.Request.Method == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            return;
        }

        await _next(context);
    }

    private static bool IsAllowedOrigin(string origin)
    {
        // Allow local development
        if (origin.StartsWith("http://localhost") || 
            origin.StartsWith("https://localhost") ||
            origin.StartsWith("http://127.0.0.1") || 
            origin.StartsWith("https://127.0.0.1"))
        {
            return true;
        }

        // Allow Firebase Workstations
        if (origin.EndsWith(".cloudworkstations.dev"))
        {
            // Security check: must be a frontend port (3000, 5173, etc.)
            if (origin.Contains("3000-") || origin.Contains("5173-"))
            {
                return true;
            }
        }

        // Allow development environments
        if (origin.Contains("localhost") || origin.Contains("127.0.0.1"))
        {
            return true;
        }

        return false;
    }
}

/// <summary>
/// Extension for easy middleware registration
/// </summary>
public static class AutoFirebaseCorsExtensions
{
    public static IApplicationBuilder UseAutoFirebaseCors(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<AutoFirebaseCorsMiddleware>();
    }
}
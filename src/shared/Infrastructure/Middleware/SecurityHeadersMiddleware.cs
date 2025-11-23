using Microsoft.AspNetCore.Http;

namespace Infrastructure.Middleware;

public class SecurityHeadersMiddleware(
    RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers
        AddSecurityHeaders(context.Response);

        await _next(context);
    }

    private static void AddSecurityHeaders(HttpResponse response)
    {
        // Prevent the page from being displayed in a frame/iframe to avoid clickjacking attacks
        response.Headers.TryAdd("X-Frame-Options", "DENY");

        // Enable the XSS filter built into most recent web browsers
        response.Headers.TryAdd("X-XSS-Protection", "1; mode=block");

        // Prevent MIME-type sniffing
        response.Headers.TryAdd("X-Content-Type-Options", "nosniff");

        // Referrer Policy
        response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");

        // Content Security Policy - restrictive policy
        response.Headers.TryAdd("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "connect-src 'self'; " +
            "font-src 'self'; " +
            "object-src 'none'; " +
            "media-src 'self'; " +
            "frame-src 'none';");

        // HTTP Strict Transport Security (HSTS)
        response.Headers.TryAdd("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        // Feature Policy / Permissions Policy
        // Allow camera and microphone for video calls (self)
        response.Headers.TryAdd("Permissions-Policy",
            "camera=(self), " +
            "microphone=(self), " +
            "geolocation=(), " +
            "payment=(), " +
            "usb=(), " +
            "magnetometer=(), " +
            "gyroscope=(), " +
            "accelerometer=()");

        // Remove server information
        response.Headers.Remove("Server");
        response.Headers.Remove("X-Powered-By");
        response.Headers.Remove("X-AspNet-Version");
        response.Headers.Remove("X-AspNetMvc-Version");
    }
}
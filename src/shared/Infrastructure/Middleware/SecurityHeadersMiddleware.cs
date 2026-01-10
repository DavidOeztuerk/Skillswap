using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.Middleware;

/// <summary>
/// Production-grade Security Headers Middleware
/// Implements comprehensive security headers based on OWASP recommendations
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        _next = next;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers before processing request
        AddSecurityHeaders(context);

        await _next(context);
    }

    private void AddSecurityHeaders(HttpContext context)
    {
        var response = context.Response;

        // =================================================================
        // 1. CLICKJACKING PROTECTION
        // =================================================================
        // Prevent the page from being displayed in a frame/iframe
        response.Headers.TryAdd("X-Frame-Options", "DENY");

        // =================================================================
        // 2. XSS PROTECTION
        // =================================================================
        // Enable XSS filter (legacy, but still useful for older browsers)
        response.Headers.TryAdd("X-XSS-Protection", "1; mode=block");

        // =================================================================
        // 3. MIME-TYPE SNIFFING PREVENTION
        // =================================================================
        // Prevent browsers from MIME-sniffing responses
        response.Headers.TryAdd("X-Content-Type-Options", "nosniff");

        // =================================================================
        // 4. REFERRER POLICY
        // =================================================================
        // Control how much referrer information is sent
        response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");

        // =================================================================
        // 5. CONTENT SECURITY POLICY (CSP)
        // =================================================================
        // Production-grade CSP with support for WebRTC, SignalR, and E2EE
        var csp = BuildContentSecurityPolicy(context);
        response.Headers.TryAdd("Content-Security-Policy", csp);

        // Report-Only mode: Test stricter CSP without breaking the app
        // In Staging/Production: Add stricter CSP as Report-Only for monitoring
        // This allows us to see what would break before enforcing
        if (!_environment.IsDevelopment())
        {
            var cspReportOnly = BuildStrictCspReportOnly(context);
            response.Headers.TryAdd("Content-Security-Policy-Report-Only", cspReportOnly);
        }

        // =================================================================
        // 6. HTTP STRICT TRANSPORT SECURITY (HSTS)
        // =================================================================
        // Force HTTPS for 1 year, including subdomains
        // Note: Only enable in production with valid SSL certificate
        if (!_environment.IsDevelopment())
        {
            response.Headers.TryAdd("Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload");
        }

        // =================================================================
        // 7. PERMISSIONS POLICY (formerly Feature Policy)
        // =================================================================
        // Control which browser features can be used
        response.Headers.TryAdd("Permissions-Policy", BuildPermissionsPolicy());

        // =================================================================
        // 8. CROSS-ORIGIN POLICIES
        // =================================================================
        // Cross-Origin-Opener-Policy (COOP) - Isolate browsing context
        response.Headers.TryAdd("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

        // Cross-Origin-Resource-Policy (CORP) - Control resource loading
        response.Headers.TryAdd("Cross-Origin-Resource-Policy", "same-origin");

        // Cross-Origin-Embedder-Policy (COEP) - Require CORP for resources
        // Note: Set to 'credentialless' for compatibility with third-party resources
        response.Headers.TryAdd("Cross-Origin-Embedder-Policy", "credentialless");

        // =================================================================
        // 9. ADDITIONAL SECURITY HEADERS
        // =================================================================
        // Expect-CT: Certificate Transparency enforcement
        if (!_environment.IsDevelopment())
        {
            response.Headers.TryAdd("Expect-CT",
                "max-age=86400, enforce");
        }

        // X-Permitted-Cross-Domain-Policies: Control Adobe Flash/PDF behavior
        response.Headers.TryAdd("X-Permitted-Cross-Domain-Policies", "none");

        // =================================================================
        // 10. REMOVE INFORMATION DISCLOSURE HEADERS
        // =================================================================
        // Remove server/technology information to prevent fingerprinting
        response.Headers.Remove("Server");
        response.Headers.Remove("X-Powered-By");
        response.Headers.Remove("X-AspNet-Version");
        response.Headers.Remove("X-AspNetMvc-Version");
        response.Headers.Remove("X-SourceFiles");
    }

    /// <summary>
    /// Build Content Security Policy for production
    /// Supports: WebRTC, SignalR, E2EE, Material-UI
    /// </summary>
    private string BuildContentSecurityPolicy(HttpContext context)
    {
        var frontendUrl = _configuration["Cors:AllowedOrigins:0"] ?? "http://localhost:3000";
        var gatewayUrl = _configuration["ServiceCommunication:GatewayBaseUrl"] ?? "http://localhost:8080";

        // Build CSP directives
        var csp = new List<string>
        {
            // Default: Only allow resources from same origin
            "default-src 'self'",

            // Scripts: Allow self + inline (for React, Vite)
            // In production, use nonces or hashes instead of 'unsafe-inline'
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",

            // Styles: Allow self + inline (for Material-UI, styled-components)
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

            // Images: Allow self + data URIs + HTTPS
            "img-src 'self' data: https: blob:",

            // Fonts: Allow self + Google Fonts
            "font-src 'self' https://fonts.gstatic.com data:",

            // Connect: API calls, WebSocket, SignalR
            $"connect-src 'self' {gatewayUrl} ws://localhost:* wss://* https:",

            // Media: WebRTC media streams
            "media-src 'self' blob: mediastream:",

            // Workers: Web Workers for E2EE
            "worker-src 'self' blob:",

            // Child/Frame: Allow same-origin iframes (for OAuth, etc.)
            "frame-src 'self'",

            // Object/Embed: Block Flash, Java, etc.
            "object-src 'none'",

            // Base URI: Restrict <base> tag
            "base-uri 'self'",

            // Form actions: Restrict form submissions
            "form-action 'self'",

            // Frame ancestors: Who can embed this site
            "frame-ancestors 'none'",

            // Upgrade insecure requests (HTTP -> HTTPS)
            _environment.IsDevelopment() ? "" : "upgrade-insecure-requests"
        };

        return string.Join("; ", csp.Where(d => !string.IsNullOrEmpty(d)));
    }

    /// <summary>
    /// Build stricter CSP for Report-Only mode (for testing before enforcement)
    /// This CSP removes 'unsafe-inline' and 'unsafe-eval' to test what would break
    /// Violations will be logged but not enforced
    /// </summary>
    private string BuildStrictCspReportOnly(HttpContext context)
    {
        var gatewayUrl = _configuration["ServiceCommunication:GatewayBaseUrl"] ?? "http://localhost:8080";

        // Stricter CSP without unsafe-inline/unsafe-eval
        // In the future, this can be enhanced with nonces for inline scripts
        var csp = new List<string>
        {
            // Default: Only allow resources from same origin
            "default-src 'self'",

            // Scripts: Only self (no inline) - will flag React/Vite inline scripts
            // TODO: Add nonce support for inline scripts
            "script-src 'self'",

            // Styles: Self + Google Fonts (no inline) - will flag Material-UI inline styles
            // TODO: Add nonce support for inline styles
            "style-src 'self' https://fonts.googleapis.com",

            // Images: Allow self + data URIs + HTTPS
            "img-src 'self' data: https: blob:",

            // Fonts: Allow self + Google Fonts
            "font-src 'self' https://fonts.gstatic.com data:",

            // Connect: API calls, WebSocket, SignalR
            $"connect-src 'self' {gatewayUrl} ws://localhost:* wss://* https:",

            // Media: WebRTC media streams
            "media-src 'self' blob: mediastream:",

            // Workers: Web Workers for E2EE
            "worker-src 'self' blob:",

            // Child/Frame: Allow same-origin iframes
            "frame-src 'self'",

            // Object/Embed: Block Flash, Java, etc.
            "object-src 'none'",

            // Base URI: Restrict <base> tag
            "base-uri 'self'",

            // Form actions: Restrict form submissions
            "form-action 'self'",

            // Frame ancestors: Who can embed this site
            "frame-ancestors 'none'",

            // Report violations to endpoint (can be configured later)
            "report-uri /api/csp-report"
        };

        return string.Join("; ", csp.Where(d => !string.IsNullOrEmpty(d)));
    }

    /// <summary>
    /// Build Permissions Policy
    /// </summary>
    private string BuildPermissionsPolicy()
    {
        return string.Join(", ", new[]
        {
            // Video calls: Allow camera and microphone for same origin
            "camera=(self)",
            "microphone=(self)",
            "display-capture=(self)",

            // Deny dangerous permissions
            "geolocation=()",
            "payment=()",
            "usb=()",
            "bluetooth=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
            "ambient-light-sensor=()",
            "autoplay=(self)",
            "encrypted-media=(self)",
            "fullscreen=(self)",
            "picture-in-picture=(self)",
            "screen-wake-lock=(self)",
            "web-share=(self)"
        });
    }
}
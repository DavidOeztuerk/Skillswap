using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Text.Json;
using Infrastructure.Security;
using Infrastructure.Security.Monitoring;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Middleware;

/// <summary>
/// Middleware for checking permissions on protected endpoints
/// </summary>
public class PermissionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PermissionMiddleware> _logger;

    public PermissionMiddleware(RequestDelegate next, ILogger<PermissionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // CRITICAL: Skip permission checks for WebSocket upgrade requests
        // WebSocket handshakes cannot receive JSON responses - it terminates the connection
        if (IsWebSocketUpgradeRequest(context))
        {
            _logger.LogDebug("Skipping permission check for WebSocket upgrade request: {Path}", context.Request.Path);
            await _next(context);
            return;
        }

        // Skip authentication check for public endpoints
        if (IsPublicEndpoint(context.Request.Path))
        {
            await _next(context);
            return;
        }

        // Check if endpoint allows anonymous access via metadata
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata?.GetMetadata<Microsoft.AspNetCore.Authorization.IAllowAnonymous>() != null)
        {
            await _next(context);
            return;
        }

        // Check if user is authenticated
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            await HandleUnauthorized(context, "User is not authenticated");
            return;
        }

        // Get required permission for the endpoint
        var requiredPermission = GetRequiredPermission(context);
        if (string.IsNullOrEmpty(requiredPermission))
        {
            await _next(context);
            return;
        }

        // Check if user has the required permission
        var userPermissions = GetUserPermissions(context.User);
        if (!HasPermission(userPermissions, requiredPermission))
        {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            _logger.LogWarning(
                "User {UserId} attempted to access {Path} without permission {Permission}",
                userId,
                context.Request.Path,
                requiredPermission);

            // Send security alert
            try
            {
                var securityAlertService = context.RequestServices.GetService<ISecurityAlertService>();
                if (securityAlertService != null)
                {
                    await securityAlertService.SendAlertAsync(
                        SecurityAlertLevel.High,
                        SecurityAlertType.UnauthorizedAccessAttempt,
                        "Unauthorized Access Attempt",
                        $"User attempted to access {context.Request.Path} without required permission: {requiredPermission}",
                        new Dictionary<string, object>
                        {
                            ["UserId"] = userId ?? "unknown",
                            ["Endpoint"] = context.Request.Path.Value ?? "",
                            ["Method"] = context.Request.Method,
                            ["RequiredPermission"] = requiredPermission,
                            ["UserPermissions"] = userPermissions,
                            ["IpAddress"] = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                            ["UserAgent"] = context.Request.Headers.UserAgent.ToString()
                        },
                        CancellationToken.None);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send security alert for unauthorized access attempt");
            }

            await HandleForbidden(context, $"Missing required permission: {requiredPermission}");
            return;
        }

        await _next(context);
    }

    private bool IsPublicEndpoint(PathString path)
    {
        var publicPaths = new[]
        {
            "/health",
            "/metrics",
            "/swagger",
            "/api-docs",
            "/auth",           // Authentication endpoints
            "/users/auth",     // User authentication endpoints
            "/api/auth",       // API authentication endpoints
            "/api/users/login", // User login endpoint
            "/api/users/register", // User registration endpoint
            "/api/users/forgot-password", // Password reset endpoints
            "/api/users/reset-password",
            "/api/users/verify-email", // Email verification endpoint
            "/api/skills",     // Public skill browsing (Udemy-style)
            "/api/categories", // Public skill categories
            "/api/proficiency-levels", // Public proficiency levels
            "/api/users/profile/", // Public user profiles
            "/register",       // Registration endpoint (legacy)
            "/login",          // Login endpoint (legacy)
            "/forgot-password", // Password reset endpoints (legacy)
            "/reset-password", // (legacy)
            "/verify-email",   // Email verification endpoint (legacy)

            // SignalR/WebSocket Hubs - MUST be public for WebSocket handshake
            // The Hub itself has [Authorize] attribute for actual authentication
            "/api/videocall/hub",
            "/hub/videocall",
            "/hubs/"
        };

        return publicPaths.Any(p => path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Checks if the request is a WebSocket upgrade request or SignalR negotiate.
    /// These requests cannot receive JSON error responses - it would terminate the connection.
    /// </summary>
    private static bool IsWebSocketUpgradeRequest(HttpContext context)
    {
        // Check for WebSocket upgrade header (Connection: Upgrade, Upgrade: websocket)
        var upgradeHeader = context.Request.Headers["Upgrade"].ToString();
        if (string.Equals(upgradeHeader, "websocket", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Check for SignalR negotiate request (POST /hub/negotiate)
        var path = context.Request.Path.Value ?? "";
        if (path.Contains("/negotiate", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Check for SignalR hub paths
        if (path.Contains("/hub", StringComparison.OrdinalIgnoreCase) &&
            (path.Contains("videocall", StringComparison.OrdinalIgnoreCase) ||
             path.Contains("notification", StringComparison.OrdinalIgnoreCase) ||
             path.Contains("chat", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return false;
    }

    private string? GetRequiredPermission(HttpContext context)
    {
        // Check for permission attribute in endpoint metadata
        var endpoint = context.GetEndpoint();
        if (endpoint != null)
        {
            var permissionAttribute = endpoint.Metadata.GetMetadata<RequirePermissionAttribute>();
            if (permissionAttribute != null)
            {
                return permissionAttribute.Permission;
            }
        }

        // Map common endpoints to permissions
        var path = context.Request.Path.Value?.ToLower() ?? "";
        var method = context.Request.Method.ToUpper();

        // Admin endpoints
        if (path.Contains("/admin/"))
        {
            // Dashboard, audit logs, and security pages
            if (path.Contains("/dashboard"))
                return Permissions.AdminAccessDashboard;
            if (path.Contains("/audit-logs") || path.Contains("/logs"))
                return Permissions.SystemViewLogs;
            if (path.Contains("/security") || path.Contains("/security-alerts"))
                return Permissions.SecurityViewAlerts;
            if (path.Contains("/statistics") || path.Contains("/analytics"))
                return Permissions.AdminViewStatistics;
            if (path.Contains("/email-templates"))
                return Permissions.SystemManageSettings;

            if (path.Contains("/users"))
            {
                return method switch
                {
                    "GET" => Permissions.UsersViewAll,
                    "POST" when path.Contains("/block") => Permissions.UsersBlock,
                    "POST" when path.Contains("/unblock") => Permissions.UsersUnblock,
                    "DELETE" => Permissions.UsersDelete,
                    _ => null
                };
            }

            if (path.Contains("/skills"))
            {
                if (path.Contains("/categories"))
                    return Permissions.SkillsManageCategories;
                if (path.Contains("/proficiency-levels"))
                    return Permissions.SkillsManageProficiency;
                if (path.Contains("/verify"))
                    return Permissions.SkillsVerify;
            }

            if (path.Contains("/appointments"))
            {
                return method switch
                {
                    "GET" => Permissions.AppointmentsViewAll,
                    "POST" when path.Contains("/cancel") => Permissions.AppointmentsCancelAny,
                    _ => Permissions.AppointmentsManage
                };
            }

            if (path.Contains("/analytics"))
            {
                return Permissions.AdminViewStatistics;
            }
        }

        // Moderation endpoints
        if (path.Contains("/moderate/"))
        {
            if (path.Contains("/reports"))
                return Permissions.ReportsHandle;
            if (path.Contains("/reviews"))
                return Permissions.ReviewsModerate;
        }

        // System management endpoints
        if (path.Contains("/system/"))
        {
            if (path.Contains("/settings"))
                return Permissions.SystemManageSettings;
            if (path.Contains("/logs"))
                return Permissions.SystemViewLogs;
            if (path.Contains("/integrations"))
                return Permissions.SystemManageIntegrations;
        }

        return null;
    }

    private List<string> GetUserPermissions(ClaimsPrincipal user)
    {
        var permissions = new List<string>();

        // Get permissions from claims
        var permissionClaims = user.FindAll("permission");
        permissions.AddRange(permissionClaims.Select(c => c.Value));

        // Get roles and add their permissions
        var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        if (roles.Any())
        {
            var rolePermissions = RolePermissions.GetPermissionsForRoles(roles);
            permissions.AddRange(rolePermissions);
        }

        return permissions.Distinct().ToList();
    }

    private bool HasPermission(List<string> userPermissions, string requiredPermission)
    {
        // Direct permission check
        if (userPermissions.Contains(requiredPermission))
            return true;

        // Check for wildcard permissions (e.g., "users:*" matches "users:create")
        var permissionParts = requiredPermission.Split(':');
        if (permissionParts.Length == 2)
        {
            var wildcardPermission = $"{permissionParts[0]}:*";
            if (userPermissions.Contains(wildcardPermission))
                return true;
        }

        // Check for system:manage_all (super admin)
        if (userPermissions.Contains(Permissions.SystemManageAll))
            return true;

        return false;
    }

    private async Task HandleUnauthorized(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";

        var response = new
        {
            success = false,  // Changed to match ApiResponse.Success property
            message = message,
            data = (object?)null,
            errors = new[] { message }
        };
        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }

    private async Task HandleForbidden(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";

        var response = new
        {
            success = false,  // Changed to match ApiResponse.Success property
            message = message,
            data = (object?)null,
            errors = new[] { message }
        };
        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}

/// <summary>
/// Attribute to mark endpoints that require specific permissions
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute
{
    public string Permission { get; }
    public string? Resource { get; }

    public RequirePermissionAttribute(string permission, string? resource = null)
    {
        Permission = permission;
        Resource = resource;
    }
}

/// <summary>
/// Extension methods for adding permission middleware
/// </summary>
public static class PermissionMiddlewareExtensions
{
    public static IApplicationBuilder UsePermissionMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<PermissionMiddleware>();
    }
}
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Text.Json;
using Infrastructure.Security;
using Microsoft.AspNetCore.Builder;

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
            _logger.LogWarning(
                "User {UserId} attempted to access {Path} without permission {Permission}",
                context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                context.Request.Path,
                requiredPermission);

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
            "/verify-email"    // Email verification endpoint (legacy)
        };

        return publicPaths.Any(p => path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase));
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
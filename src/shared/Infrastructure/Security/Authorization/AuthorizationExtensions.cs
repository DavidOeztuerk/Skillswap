// using Microsoft.AspNetCore.Authorization;
// using Microsoft.Extensions.DependencyInjection;
// using Microsoft.Extensions.Configuration;
// using Microsoft.AspNetCore.Mvc.Filters;

// namespace Infrastructure.Security.Authorization;

// /// <summary>
// /// Extension methods for authorization services
// /// </summary>
// public static class AuthorizationExtensions
// {
//     /// <summary>
//     /// Add resource-based authorization services
//     /// </summary>
//     public static IServiceCollection AddResourceAuthorization(
//         this IServiceCollection services,
//         IConfiguration configuration)
//     {
//         var redisConnectionString = configuration.GetConnectionString("Redis");

//         if (!string.IsNullOrEmpty(redisConnectionString))
//         {
//             // Redis-based authorization
//             services.AddSingleton<IResourceAuthorizationService, ResourceAuthorizationService>();
//         }
//         else
//         {
//             // In-memory fallback
//             services.AddSingleton<IResourceAuthorizationService, InMemoryResourceAuthorizationService>();
//         }

//         // Register permission resolver
//         services.AddSingleton<IPermissionResolver, PermissionResolver>();

//         // Register authorization handlers
//         services.AddScoped<IAuthorizationHandler, ResourceAuthorizationHandler>();
//         services.AddScoped<IAuthorizationHandler, OwnershipAuthorizationHandler>();

//         // Add authorization policies
//         services.AddAuthorization(options =>
//         {
//             // Resource-based policies
//             options.AddPolicy("ResourceRead", policy =>
//                 policy.Requirements.Add(new ResourceRequirement(SkillswapActions.READ)));

//             options.AddPolicy("ResourceWrite", policy =>
//                 policy.Requirements.Add(new ResourceRequirement(SkillswapActions.UPDATE)));

//             options.AddPolicy("ResourceDelete", policy =>
//                 policy.Requirements.Add(new ResourceRequirement(SkillswapActions.DELETE)));

//             options.AddPolicy("ResourceOwner", policy =>
//                 policy.Requirements.Add(new OwnershipRequirement()));

//             // Admin policies
//             options.AddPolicy("AdminOnly", policy =>
//                 policy.RequireRole("Admin"));

//             options.AddPolicy("SuperAdminOnly", policy =>
//                 policy.RequireRole("SuperAdmin"));

//             // Service-specific policies
//             options.AddPolicy("UserManagement", policy =>
//                 policy.Requirements.Add(new ResourceRequirement(SkillswapActions.ADMIN, SkillswapResources.USER)));

//             options.AddPolicy("SkillManagement", policy =>
//                 policy.Requirements.Add(new ResourceRequirement(SkillswapActions.ADMIN, SkillswapResources.SKILL)));

//             options.AddPolicy("SystemAccess", policy =>
//                 policy.Requirements.Add(new ResourceRequirement(SkillswapActions.MONITOR, SkillswapResources.SYSTEM)));
//         });

//         return services;
//     }

//     /// <summary>
//     /// Add authorization middleware
//     /// </summary>
//     public static IServiceCollection AddAuthorizationMiddleware(this IServiceCollection services)
//     {
//         services.AddTransient<ResourceAuthorizationMiddleware>();
//         return services;
//     }
// }

// /// <summary>
// /// Resource authorization requirement
// /// </summary>
// public class ResourceRequirement : IAuthorizationRequirement
// {
//     public string Action { get; }
//     public string? ResourceType { get; }

//     public ResourceRequirement(string action, string? resourceType = null)
//     {
//         Action = action;
//         ResourceType = resourceType;
//     }
// }

// /// <summary>
// /// Ownership authorization requirement
// /// </summary>
// public class OwnershipRequirement : IAuthorizationRequirement
// {
//     public string? ResourceType { get; }

//     public OwnershipRequirement(string? resourceType = null)
//     {
//         ResourceType = resourceType;
//     }
// }

// /// <summary>
// /// Resource authorization handler
// /// </summary>
// public class ResourceAuthorizationHandler : AuthorizationHandler<ResourceRequirement>
// {
//     private readonly IResourceAuthorizationService _authorizationService;

//     public ResourceAuthorizationHandler(IResourceAuthorizationService authorizationService)
//     {
//         _authorizationService = authorizationService;
//     }

//     protected override async Task HandleRequirementAsync(
//         AuthorizationHandlerContext context,
//         ResourceRequirement requirement)
//     {
//         var resourceType = requirement.ResourceType ?? GetResourceTypeFromContext(context);
//         var resourceData = GetResourceDataFromContext(context);

//         if (string.IsNullOrEmpty(resourceType))
//         {
//             context.Fail();
//             return;
//         }

//         var result = await _authorizationService.AuthorizeAsync(
//             context.User,
//             resourceType,
//             requirement.Action,
//             resourceData);

//         if (result.Succeeded)
//         {
//             context.Succeed(requirement);
//         }
//         else
//         {
//             context.Fail();
//         }
//     }

//     private static string? GetResourceTypeFromContext(AuthorizationHandlerContext context)
//     {
//         // Try to extract resource type from route data or other context
//         if (context.Resource is AuthorizationFilterContext filterContext)
//         {
//             var routeData = filterContext.RouteData.Values;

//             // Extract from controller name
//             if (routeData.TryGetValue("controller", out var controller))
//             {
//                 return controller?.ToString();
//             }
//         }

//         return null;
//     }

//     private static object? GetResourceDataFromContext(AuthorizationHandlerContext context)
//     {
//         // Try to extract resource data from context
//         if (context.Resource is AuthorizationFilterContext filterContext)
//         {
//             var routeData = filterContext.RouteData.Values;

//             // Extract resource ID if available
//             if (routeData.TryGetValue("id", out var id))
//             {
//                 return new { Id = id };
//             }
//         }

//         return null;
//     }
// }

// /// <summary>
// /// Ownership authorization handler
// /// </summary>
// public class OwnershipAuthorizationHandler : AuthorizationHandler<OwnershipRequirement>
// {
//     private readonly IResourceAuthorizationService _authorizationService;

//     public OwnershipAuthorizationHandler(IResourceAuthorizationService authorizationService)
//     {
//         _authorizationService = authorizationService;
//     }

//     protected override async Task HandleRequirementAsync(
//         AuthorizationHandlerContext context,
//         OwnershipRequirement requirement)
//     {
//         var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
//         if (string.IsNullOrEmpty(userId))
//         {
//             context.Fail();
//             return;
//         }

//         var resourceType = requirement.ResourceType ?? GetResourceTypeFromContext(context);
//         var resourceId = GetResourceIdFromContext(context);

//         if (string.IsNullOrEmpty(resourceType) || string.IsNullOrEmpty(resourceId))
//         {
//             context.Fail();
//             return;
//         }

//         var isOwner = await _authorizationService.IsResourceOwnerAsync(userId, resourceType, resourceId);

//         if (isOwner)
//         {
//             context.Succeed(requirement);
//         }
//         else
//         {
//             context.Fail();
//         }
//     }

//     private static string? GetResourceTypeFromContext(AuthorizationHandlerContext context)
//     {
//         if (context.Resource is AuthorizationFilterContext filterContext)
//         {
//             var routeData = filterContext.RouteData.Values;

//             if (routeData.TryGetValue("controller", out var controller))
//             {
//                 return controller?.ToString();
//             }
//         }

//         return null;
//     }

//     private static string? GetResourceIdFromContext(AuthorizationHandlerContext context)
//     {
//         if (context.Resource is AuthorizationFilterContext filterContext)
//         {
//             var routeData = filterContext.RouteData.Values;

//             if (routeData.TryGetValue("id", out var id))
//             {
//                 return id?.ToString();
//             }
//         }

//         return null;
//     }
// }

// /// <summary>
// /// In-memory resource authorization service for development/testing
// /// </summary>
// public class InMemoryResourceAuthorizationService : IResourceAuthorizationService
// {
//     private readonly Dictionary<string, Dictionary<string, List<string>>> _userPermissions = new();
//     private readonly Dictionary<string, string> _resourceOwners = new();
//     private readonly IPermissionResolver _permissionResolver;
//     private readonly object _lock = new();

//     public InMemoryResourceAuthorizationService(IPermissionResolver permissionResolver)
//     {
//         _permissionResolver = permissionResolver;
//     }

//     public async Task<AuthorizationResult> AuthorizeAsync(
//         System.Security.Claims.ClaimsPrincipal user,
//         string resource,
//         string action,
//         object? resourceData = null,
//         CancellationToken cancellationToken = default)
//     {
//         var userId = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
//         if (string.IsNullOrEmpty(userId))
//         {
//             return AuthorizationResult.Fail("User ID not found");
//         }

//         var requiredPermissions = await _permissionResolver.GetRequiredPermissionsAsync(resource, action);
//         var userPermissions = await GetUserPermissionsAsync(userId, resource, GetResourceId(resourceData) ?? "*", cancellationToken);

//         foreach (var permission in requiredPermissions)
//         {
//             if (!userPermissions.Contains(permission.Name))
//             {
//                 return AuthorizationResult.Fail($"Missing permission: {permission.Name}");
//             }
//         }

//         return AuthorizationResult.Success();
//     }

//     public Task<bool> IsResourceOwnerAsync(string userId, string resourceType, string resourceId, CancellationToken cancellationToken = default)
//     {
//         lock (_lock)
//         {
//             var key = $"{resourceType}:{resourceId}";
//             return Task.FromResult(_resourceOwners.TryGetValue(key, out var owner) && owner == userId);
//         }
//     }

//     public Task<IEnumerable<string>> GetUserPermissionsAsync(string userId, string resourceType, string resourceId, CancellationToken cancellationToken = default)
//     {
//         lock (_lock)
//         {
//             var key = $"{resourceType}:{resourceId}";
//             if (_userPermissions.TryGetValue(userId, out var userResources) &&
//                 userResources.TryGetValue(key, out var permissions))
//             {
//                 return Task.FromResult(permissions.AsEnumerable());
//             }
//             return Task.FromResult(Enumerable.Empty<string>());
//         }
//     }

//     public Task GrantPermissionAsync(string userId, string resourceType, string resourceId, string permission, string grantedBy, DateTime? expiresAt = null, CancellationToken cancellationToken = default)
//     {
//         lock (_lock)
//         {
//             if (!_userPermissions.ContainsKey(userId))
//             {
//                 _userPermissions[userId] = new Dictionary<string, List<string>>();
//             }

//             var key = $"{resourceType}:{resourceId}";
//             if (!_userPermissions[userId].ContainsKey(key))
//             {
//                 _userPermissions[userId][key] = new List<string>();
//             }

//             if (!_userPermissions[userId][key].Contains(permission))
//             {
//                 _userPermissions[userId][key].Add(permission);
//             }
//         }
//         return Task.CompletedTask;
//     }

//     public Task RevokePermissionAsync(string userId, string resourceType, string resourceId, string permission, string revokedBy, CancellationToken cancellationToken = default)
//     {
//         lock (_lock)
//         {
//             var key = $"{resourceType}:{resourceId}";
//             if (_userPermissions.TryGetValue(userId, out var userResources) &&
//                 userResources.TryGetValue(key, out var permissions))
//             {
//                 permissions.Remove(permission);
//             }
//         }
//         return Task.CompletedTask;
//     }

//     public Task<bool> HasPermissionAsync(string userId, string permission, string? resourceType = null, string? resourceId = null, CancellationToken cancellationToken = default)
//     {
//         lock (_lock)
//         {
//             if (string.IsNullOrEmpty(resourceType))
//             {
//                 // Check global permissions
//                 return Task.FromResult(false);
//             }

//             var key = $"{resourceType}:{resourceId ?? "*"}";
//             if (_userPermissions.TryGetValue(userId, out var userResources) &&
//                 userResources.TryGetValue(key, out var permissions))
//             {
//                 return Task.FromResult(permissions.Contains(permission));
//             }
//             return Task.FromResult(false);
//         }
//     }

//     public Task<IEnumerable<ResourceAccess>> GetAccessibleResourcesAsync(string userId, string resourceType, CancellationToken cancellationToken = default)
//     {
//         lock (_lock)
//         {
//             var accessList = new List<ResourceAccess>();

//             if (_userPermissions.TryGetValue(userId, out var userResources))
//             {
//                 foreach (var kvp in userResources)
//                 {
//                     var parts = kvp.Key.Split(':');
//                     if (parts.Length == 2 && parts[0] == resourceType)
//                     {
//                         accessList.Add(new ResourceAccess
//                         {
//                             ResourceType = resourceType,
//                             ResourceId = parts[1],
//                             Permissions = kvp.Value,
//                             GrantedAt = DateTime.UtcNow,
//                             GrantedBy = "System"
//                         });
//                     }
//                 }
//             }

//             return Task.FromResult(accessList.AsEnumerable());
//         }
//     }

//     private static string? GetResourceId(object? resourceData)
//     {
//         return resourceData?.GetType().GetProperty("Id")?.GetValue(resourceData)?.ToString();
//     }
// }
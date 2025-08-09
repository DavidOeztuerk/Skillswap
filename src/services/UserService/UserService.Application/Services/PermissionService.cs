// using Microsoft.Extensions.Caching.Distributed;
// using Microsoft.Extensions.Logging;
// using System.Text.Json;
// using UserService.Domain.Models;
// using UserService.Domain.Repositories;

// namespace UserService.Application.Services;

// public class PermissionService(
//     IPermissionRepository repository,
//     IDistributedCache cache,
//     ILogger<PermissionService> logger)
//     : IPermissionService
// {
//     private readonly IPermissionRepository _repository = repository;
//     private readonly IDistributedCache _cache = cache;
//     private readonly ILogger<PermissionService> _logger = logger;
//     private const int CacheExpirationMinutes = 15;

//     public async Task<bool> UserHasPermissionAsync(Guid userId, string permissionName, string? resourceId = null)
//     {
//         try
//         {
//             // Check cache first
//             var cacheKey = $"user_permission:{userId}:{permissionName}:{resourceId ?? "global"}";
//             var cached = await _cache.GetStringAsync(cacheKey);
//             if (cached != null)
//             {
//                 return JsonSerializer.Deserialize<bool>(cached);
//             }

//             var hasPermission = await _repository.UserHasPermissionAsync(userId.ToString(), permissionName, resourceId);

//             await CacheResultAsync(cacheKey, hasPermission);
//             return hasPermission;
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error checking permission {Permission} for user {UserId}",
//                 permissionName, userId);
//             return false;
//         }
//     }

//     public async Task<bool> UserHasAnyPermissionAsync(Guid userId, params string[] permissionNames)
//     {
//         foreach (var permissionName in permissionNames)
//         {
//             if (await UserHasPermissionAsync(userId, permissionName))
//                 return true;
//         }
//         return false;
//     }

//     public async Task<bool> UserHasAllPermissionsAsync(Guid userId, params string[] permissionNames)
//     {
//         foreach (var permissionName in permissionNames)
//         {
//             if (!await UserHasPermissionAsync(userId, permissionName))
//                 return false;
//         }
//         return true;
//     }

//     public async Task<IEnumerable<Permission>> GetUserPermissionsAsync(Guid userId, bool includeRolePermissions = true)
//     {
//         var permissions = new HashSet<Permission>();

//         // Get direct user permissions
//         var userPermissions = await _repository.GetUserPermissionsAsync(userId.ToString());
//         foreach (var up in userPermissions)
//         {
//             if (up.Permission != null)
//                 permissions.Add(up.Permission);
//         }

//         if (includeRolePermissions)
//         {
//             // Get permissions from roles
//             var userRoleNames = await _repository.GetUserRoleNamesAsync(userId.ToString());

//             foreach (var roleName in userRoleNames)
//             {
//                 var role = await _repository.GetRoleByNameAsync(roleName);
//                 if (role != null)
//                 {
//                     var rolePermissions = role.GetAllPermissions();
//                     foreach (var permission in rolePermissions)
//                     {
//                         permissions.Add(permission);
//                     }
//                 }
//             }
//         }

//         return permissions;
//     }

//     public async Task<IEnumerable<string>> GetUserPermissionNamesAsync(Guid userId)
//     {
//         return await _repository.GetUserPermissionNamesAsync(userId.ToString());
//     }

//     public async Task<bool> UserHasRoleAsync(Guid userId, string roleName)
//     {
//         return await _repository.UserHasRoleAsync(userId.ToString(), roleName);
//     }

//     public async Task<bool> UserHasAnyRoleAsync(Guid userId, params string[] roleNames)
//     {
//         foreach (var roleName in roleNames)
//         {
//             if (await UserHasRoleAsync(userId, roleName))
//                 return true;
//         }
//         return false;
//     }

//     public async Task<IEnumerable<Role>> GetUserRolesAsync(Guid userId)
//     {
//         var roleNames = await _repository.GetUserRoleNamesAsync(userId.ToString());
//         var roles = new List<Role>();

//         foreach (var roleName in roleNames)
//         {
//             var role = await _repository.GetRoleByNameAsync(roleName);
//             if (role != null)
//                 roles.Add(role);
//         }

//         return roles;
//     }

//     public async Task<IEnumerable<string>> GetUserRoleNamesAsync(Guid userId)
//     {
//         return await _repository.GetUserRoleNamesAsync(userId.ToString());
//     }

//     public async Task<bool> RoleHasPermissionAsync(Guid roleId, string permissionName)
//     {
//         return await _repository.RoleHasPermissionAsync(roleId.ToString(), permissionName);
//     }

//     public async Task<IEnumerable<Permission>> GetRolePermissionsAsync(Guid roleId, bool includeInherited = true)
//     {
//         var role = await _repository.GetRoleByIdAsync(roleId.ToString());
//         if (role == null) return Enumerable.Empty<Permission>();

//         if (includeInherited)
//         {
//             return role.GetAllPermissions();
//         }

//         return role.RolePermissions
//             .Where(rp => rp.IsActive)
//             .Select(rp => rp.Permission)
//             .Where(p => p != null);
//     }

//     public async Task GrantPermissionToUserAsync(Guid userId, string permissionName, Guid? grantedBy = null,
//         DateTime? expiresAt = null, string? resourceId = null, string? reason = null)
//     {
//         var permission = await _repository.GetPermissionByNameAsync(permissionName);
//         if (permission == null)
//             throw new ArgumentException("Permission not found", nameof(permissionName));

//         // Check if permission already exists
//         var existingPermission = await _repository.GetUserPermissionAsync(
//             userId.ToString(), permission.Id, resourceId);

//         if (existingPermission != null)
//         {
//             if (!existingPermission.IsActive || !existingPermission.IsGranted)
//             {
//                 // Reactivate existing permission
//                 existingPermission.IsActive = true;
//                 existingPermission.IsGranted = true;
//                 existingPermission.GrantedAt = DateTime.UtcNow;
//                 existingPermission.GrantedBy = grantedBy?.ToString();
//                 existingPermission.Reason = reason;
//                 existingPermission.UpdatedAt = DateTime.UtcNow;
//             }
//             if (expiresAt.HasValue)
//             {
//                 existingPermission.UpdateExpiration(expiresAt);
//             }
//             await _repository.UpdateUserPermissionAsync(existingPermission);
//         }
//         else
//         {
//             var userPermission = UserPermission.Create(
//                 userId.ToString(),
//                 permission.Id,
//                 true,
//                 grantedBy?.ToString(),
//                 expiresAt,
//                 resourceId,
//                 null,
//                 reason);
//             await _repository.AddUserPermissionAsync(userPermission);
//         }

//         await InvalidateUserPermissionsCacheAsync(userId);
//         _logger.LogInformation("Granted permission {Permission} to user {UserId}", permissionName, userId);
//     }

//     public async Task RevokePermissionFromUserAsync(Guid userId, string permissionName, Guid? revokedBy = null,
//         string? reason = null)
//     {
//         var permission = await _repository.GetPermissionByNameAsync(permissionName);
//         if (permission == null) return;

//         var userPermissions = await _repository.GetUserPermissionsAsync(userId.ToString());
//         var permissionsToRevoke = userPermissions
//             .Where(up => up.PermissionId == permission.Id && up.IsActive);

//         foreach (var userPermission in permissionsToRevoke)
//         {
//             userPermission.Revoke(revokedBy?.ToString(), reason);
//             await _repository.UpdateUserPermissionAsync(userPermission);
//         }

//         await InvalidateUserPermissionsCacheAsync(userId);
//         _logger.LogInformation("Revoked permission {Permission} from user {UserId}", permissionName, userId);
//     }

//     public async Task GrantPermissionToRoleAsync(Guid roleId, string permissionName, Guid? grantedBy = null,
//         string? reason = null)
//     {
//         var role = await _repository.GetRoleByIdAsync(roleId.ToString());
//         if (role == null)
//             throw new ArgumentException("Role not found", nameof(roleId));

//         var permission = await _repository.GetPermissionByNameAsync(permissionName);
//         if (permission == null)
//             throw new ArgumentException("Permission not found", nameof(permissionName));

//         var existingPermission = await _repository.GetRolePermissionAsync(roleId.ToString(), permission.Id);

//         if (existingPermission != null)
//         {
//             if (!existingPermission.IsActive)
//             {
//                 existingPermission.Reactivate(grantedBy?.ToString(), reason);
//                 await _repository.UpdateRolePermissionAsync(existingPermission);
//             }
//         }
//         else
//         {
//             var rolePermission = RolePermission.Create(
//                 roleId.ToString(),
//                 permission.Id,
//                 grantedBy?.ToString(),
//                 reason);
//             await _repository.AddRolePermissionAsync(rolePermission);
//         }

//         await InvalidateRolePermissionsCacheAsync(roleId);
//         _logger.LogInformation("Granted permission {Permission} to role {RoleId}", permissionName, roleId);
//     }

//     public async Task RevokePermissionFromRoleAsync(Guid roleId, string permissionName, Guid? revokedBy = null,
//         string? reason = null)
//     {
//         var permission = await _repository.GetPermissionByNameAsync(permissionName);
//         if (permission == null) return;

//         var rolePermission = await _repository.GetRolePermissionAsync(roleId.ToString(), permission.Id);
//         if (rolePermission != null && rolePermission.IsActive)
//         {
//             rolePermission.Revoke(revokedBy?.ToString(), reason);
//             await _repository.UpdateRolePermissionAsync(rolePermission);
//             await InvalidateRolePermissionsCacheAsync(roleId);
//         }

//         _logger.LogInformation("Revoked permission {Permission} from role {RoleId}", permissionName, roleId);
//     }

//     public async Task AssignRoleToUserAsync(Guid userId, string roleName, Guid? assignedBy = null, string? reason = null)
//     {
//         var role = await _repository.GetRoleByNameAsync(roleName);
//         if (role == null)
//             throw new ArgumentException("Role not found", nameof(roleName));

//         var existingUserRole = await _repository.GetUserRoleAsync(userId.ToString(), roleName);

//         if (existingUserRole != null)
//         {
//             if (existingUserRole.RevokedAt.HasValue)
//             {
//                 // Reactivate the role
//                 existingUserRole.RevokedAt = null;
//                 existingUserRole.RevokedBy = null;
//                 existingUserRole.AssignedAt = DateTime.UtcNow;
//                 existingUserRole.AssignedBy = assignedBy?.ToString();
//                 await _repository.UpdateUserRoleAsync(existingUserRole);
//             }
//         }
//         else
//         {
//             var userRole = new UserRole
//             {
//                 Id = Guid.NewGuid().ToString(),
//                 UserId = userId.ToString(),
//                 Role = roleName,
//                 AssignedAt = DateTime.UtcNow,
//                 AssignedBy = assignedBy?.ToString()
//             };
//             await _repository.AddUserRoleAsync(userRole);
//         }

//         await InvalidateUserPermissionsCacheAsync(userId);
//         _logger.LogInformation("Assigned role {Role} to user {UserId}", roleName, userId);
//     }

//     public async Task RemoveRoleFromUserAsync(Guid userId, string roleName, Guid? removedBy = null, string? reason = null)
//     {
//         var userRole = await _repository.GetUserRoleAsync(userId.ToString(), roleName);
//         if (userRole != null && !userRole.RevokedAt.HasValue)
//         {
//             userRole.RevokedAt = DateTime.UtcNow;
//             userRole.RevokedBy = removedBy?.ToString();
//             await _repository.UpdateUserRoleAsync(userRole);
//             await InvalidateUserPermissionsCacheAsync(userId);
//         }

//         _logger.LogInformation("Removed role {Role} from user {UserId}", roleName, userId);
//     }

//     public async Task<Role> CreateRoleAsync(string name, string description, int priority = 0, Guid? parentRoleId = null)
//     {
//         var existingRole = await _repository.GetRoleByNameAsync(name);
//         if (existingRole != null)
//             throw new ArgumentException("Role already exists", nameof(name));

//         var role = Role.Create(name, description, priority, false, parentRoleId?.ToString());
//         await _repository.AddRoleAsync(role);

//         _logger.LogInformation("Created role {Role}", name);
//         return role;
//     }

//     public async Task DeleteRoleAsync(Guid roleId)
//     {
//         await _repository.DeleteRoleAsync(roleId.ToString());
//         await InvalidateRolePermissionsCacheAsync(roleId);
//         _logger.LogInformation("Deleted role {RoleId}", roleId);
//     }

//     public async Task<IEnumerable<Role>> GetAllRolesAsync()
//     {
//         return await _repository.GetAllRolesAsync();
//     }

//     public async Task<bool> UserCanAccessResourceAsync(Guid userId, string resourceType, string resourceId, string action)
//     {
//         var permissionName = $"{resourceType}.{action}";
//         return await UserHasPermissionAsync(userId, permissionName, resourceId);
//     }

//     public async Task GrantResourcePermissionAsync(Guid userId, string resourceType, string resourceId, string action,
//         Guid? grantedBy = null, DateTime? expiresAt = null)
//     {
//         var permissionName = $"{resourceType}.{action}";
//         await GrantPermissionToUserAsync(userId, permissionName, grantedBy, expiresAt, resourceId,
//             $"Access to {resourceType} {resourceId}");
//     }

//     public async Task RevokeResourcePermissionAsync(Guid userId, string resourceType, string resourceId, string action,
//         Guid? revokedBy = null)
//     {
//         var permissionName = $"{resourceType}.{action}";
//         await RevokePermissionFromUserAsync(userId, permissionName, revokedBy,
//             $"Revoked access to {resourceType} {resourceId}");
//     }

//     public async Task<IEnumerable<Permission>> GetAllPermissionsAsync()
//     {
//         return await _repository.GetAllPermissionsAsync();
//     }

//     public async Task<IEnumerable<Permission>> GetPermissionsByCategoryAsync(string category)
//     {
//         return await _repository.GetPermissionsByCategoryAsync(category);
//     }

//     public async Task<Permission?> GetPermissionByNameAsync(string name)
//     {
//         return await _repository.GetPermissionByNameAsync(name);
//     }

//     public async Task<IEnumerable<UserPermission>> GetUserPermissionHistoryAsync(Guid userId)
//     {
//         return await _repository.GetUserPermissionHistoryAsync(userId.ToString());
//     }

//     public async Task<IEnumerable<RolePermission>> GetRolePermissionHistoryAsync(Guid roleId)
//     {
//         return await _repository.GetRolePermissionHistoryAsync(roleId.ToString());
//     }

//     public async Task InvalidateUserPermissionsCacheAsync(Guid userId)
//     {
//         var pattern = $"user_permission:{userId}:*";
//         _logger.LogDebug("Invalidating cache for user {UserId}", userId);
//         // Note: This is a simplified version. In production, you'd need a more sophisticated cache invalidation
//     }

//     public async Task InvalidateRolePermissionsCacheAsync(Guid roleId)
//     {
//         // Invalidate cache for all users with this role
//         var role = await _repository.GetRoleByIdAsync(roleId.ToString());
//         if (role != null)
//         {
//             var userRoles = await _repository.GetUserRolesAsync(roleId.ToString());
//             foreach (var userRole in userRoles)
//             {
//                 if (Guid.TryParse(userRole.UserId, out var userId))
//                 {
//                     await InvalidateUserPermissionsCacheAsync(userId);
//                 }
//             }
//         }
//     }

//     public async Task InvalidateAllPermissionsCacheAsync()
//     {
//         _logger.LogDebug("Invalidating all permissions cache");
//         // In production, implement proper cache invalidation
//     }

//     public async Task GrantMultiplePermissionsToUserAsync(Guid userId, IEnumerable<string> permissionNames,
//         Guid? grantedBy = null)
//     {
//         foreach (var permissionName in permissionNames)
//         {
//             await GrantPermissionToUserAsync(userId, permissionName, grantedBy);
//         }
//     }

//     public async Task RevokeMultiplePermissionsFromUserAsync(Guid userId, IEnumerable<string> permissionNames,
//         Guid? revokedBy = null)
//     {
//         foreach (var permissionName in permissionNames)
//         {
//             await RevokePermissionFromUserAsync(userId, permissionName, revokedBy);
//         }
//     }

//     public async Task SyncUserPermissionsAsync(Guid userId, IEnumerable<string> permissionNames)
//     {
//         var currentPermissions = await GetUserPermissionNamesAsync(userId);
//         var targetPermissions = new HashSet<string>(permissionNames);

//         // Revoke permissions that are not in the target list
//         var toRevoke = currentPermissions.Where(p => !targetPermissions.Contains(p));
//         await RevokeMultiplePermissionsFromUserAsync(userId, toRevoke);

//         // Grant permissions that are in the target list but not current
//         var toGrant = targetPermissions.Where(p => !currentPermissions.Contains(p));
//         await GrantMultiplePermissionsToUserAsync(userId, toGrant);
//     }

//     public async Task<bool> EvaluateConditionalPermissionAsync(Guid userId, string permissionName,
//         Dictionary<string, object> context)
//     {
//         var userPermissions = await _repository.GetUserPermissionsAsync(userId.ToString());
//         var conditionalPermission = userPermissions
//             .FirstOrDefault(up => up.Permission?.Name == permissionName &&
//                                  up.IsActive &&
//                                  up.Conditions != null);

//         if (conditionalPermission == null)
//         {
//             return await UserHasPermissionAsync(userId, permissionName);
//         }

//         // Parse and evaluate conditions
//         try
//         {
//             var conditions = JsonSerializer.Deserialize<Dictionary<string, object>>(conditionalPermission.Conditions);
//             if (conditions == null) return true;

//             // Simple condition evaluation - in production, use a proper expression evaluator
//             foreach (var condition in conditions)
//             {
//                 if (context.TryGetValue(condition.Key, out var contextValue))
//                 {
//                     if (!condition.Value.Equals(contextValue))
//                         return false;
//                 }
//             }

//             return true;
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error evaluating conditional permission {Permission} for user {UserId}",
//                 permissionName, userId);
//             return false;
//         }
//     }

//     private async Task CacheResultAsync(string key, bool value)
//     {
//         try
//         {
//             var options = new DistributedCacheEntryOptions
//             {
//                 AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
//             };
//             await _cache.SetStringAsync(key, JsonSerializer.Serialize(value), options);
//         }
//         catch (Exception ex)
//         {
//             _logger.LogWarning(ex, "Failed to cache permission result");
//         }
//     }
// }
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories
{
    public class PermissionRepository : IPermissionRepository
    {
        private readonly UserDbContext _context;
        private readonly ILogger<PermissionRepository> _logger;

        public PermissionRepository(UserDbContext context, ILogger<PermissionRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Permission operations
        public async Task<Permission?> GetPermissionByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            return await _context.Permissions
                .Include(p => p.RolePermissions)
                .Include(p => p.UserPermissions)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<Permission?> GetPermissionByNameAsync(string name, CancellationToken cancellationToken = default)
        {
            return await _context.Permissions
                .FirstOrDefaultAsync(p => p.Name == name && p.IsActive, cancellationToken);
        }

        public async Task<IEnumerable<Permission>> GetAllPermissionsAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Permissions
                .Where(p => p.IsActive)
                .OrderBy(p => p.Category)
                .ThenBy(p => p.Name)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Permission>> GetPermissionsByCategoryAsync(string category, CancellationToken cancellationToken = default)
        {
            return await _context.Permissions
                .Where(p => p.Category == category && p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync(cancellationToken);
        }

        public async Task<Permission> AddPermissionAsync(Permission permission, CancellationToken cancellationToken = default)
        {
            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync(cancellationToken);
            return permission;
        }

        public async Task UpdatePermissionAsync(Permission permission, CancellationToken cancellationToken = default)
        {
            _context.Permissions.Update(permission);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeletePermissionAsync(string id, CancellationToken cancellationToken = default)
        {
            var permission = await GetPermissionByIdAsync(id, cancellationToken);
            if (permission != null)
            {
                permission.Deactivate();
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // Role operations
        public async Task<Role?> GetRoleByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            return await _context.Roles
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .Include(r => r.ParentRole)
                .Include(r => r.ChildRoles)
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        }

        public async Task<Role?> GetRoleByNameAsync(string name, CancellationToken cancellationToken = default)
        {
            return await _context.Roles
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(r => r.Name == name && r.IsActive, cancellationToken);
        }

        public async Task<IEnumerable<Role>> GetAllRolesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Roles
                .Where(r => r.IsActive)
                .OrderByDescending(r => r.Priority)
                .ThenBy(r => r.Name)
                .ToListAsync(cancellationToken);
        }

        public async Task<Role> AddRoleAsync(Role role, CancellationToken cancellationToken = default)
        {
            _context.Roles.Add(role);
            await _context.SaveChangesAsync(cancellationToken);
            return role;
        }

        public async Task UpdateRoleAsync(Role role, CancellationToken cancellationToken = default)
        {
            _context.Roles.Update(role);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteRoleAsync(string id, CancellationToken cancellationToken = default)
        {
            var role = await GetRoleByIdAsync(id, cancellationToken);
            if (role != null && !role.IsSystemRole)
            {
                role.Deactivate();
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // User permissions
        public async Task<IEnumerable<UserPermission>> GetUserPermissionsAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserPermissions
                .Include(up => up.Permission)
                .Where(up => up.UserId == userId &&
                           up.IsActive &&
                           up.IsGranted &&
                           (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow))
                .ToListAsync(cancellationToken);
        }

        public async Task<UserPermission?> GetUserPermissionAsync(string userId, string permissionId, string? resourceId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.UserPermissions
                .Include(up => up.Permission)
                .Where(up => up.UserId == userId && up.PermissionId == permissionId);

            if (resourceId != null)
            {
                query = query.Where(up => up.ResourceId == resourceId);
            }

            return await query.FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<UserPermission> AddUserPermissionAsync(UserPermission userPermission, CancellationToken cancellationToken = default)
        {
            _context.UserPermissions.Add(userPermission);
            await _context.SaveChangesAsync(cancellationToken);
            return userPermission;
        }

        public async Task UpdateUserPermissionAsync(UserPermission userPermission, CancellationToken cancellationToken = default)
        {
            _context.UserPermissions.Update(userPermission);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteUserPermissionAsync(string id, CancellationToken cancellationToken = default)
        {
            var userPermission = await _context.UserPermissions.FindAsync(new object[] { id }, cancellationToken);
            if (userPermission != null)
            {
                _context.UserPermissions.Remove(userPermission);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        public async Task<IEnumerable<UserPermission>> GetUserPermissionHistoryAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserPermissions
                .Include(up => up.Permission)
                .Include(up => up.GrantedByUser)
                .Include(up => up.RevokedByUser)
                .Where(up => up.UserId == userId)
                .OrderByDescending(up => up.GrantedAt)
                .ToListAsync(cancellationToken);
        }

        // Role permissions
        public async Task<IEnumerable<RolePermission>> GetRolePermissionsAsync(string roleId, CancellationToken cancellationToken = default)
        {
            return await _context.RolePermissions
                .Include(rp => rp.Permission)
                .Where(rp => rp.RoleId == roleId && rp.IsActive)
                .ToListAsync(cancellationToken);
        }

        public async Task<RolePermission?> GetRolePermissionAsync(string roleId, string permissionId, CancellationToken cancellationToken = default)
        {
            return await _context.RolePermissions
                .Include(rp => rp.Permission)
                .FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, cancellationToken);
        }

        public async Task<RolePermission> AddRolePermissionAsync(RolePermission rolePermission, CancellationToken cancellationToken = default)
        {
            _context.RolePermissions.Add(rolePermission);
            await _context.SaveChangesAsync(cancellationToken);
            return rolePermission;
        }

        public async Task UpdateRolePermissionAsync(RolePermission rolePermission, CancellationToken cancellationToken = default)
        {
            _context.RolePermissions.Update(rolePermission);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteRolePermissionAsync(string id, CancellationToken cancellationToken = default)
        {
            var rolePermission = await _context.RolePermissions.FindAsync(new object[] { id }, cancellationToken);
            if (rolePermission != null)
            {
                _context.RolePermissions.Remove(rolePermission);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        public async Task<IEnumerable<RolePermission>> GetRolePermissionHistoryAsync(string roleId, CancellationToken cancellationToken = default)
        {
            return await _context.RolePermissions
                .Include(rp => rp.Permission)
                .Include(rp => rp.GrantedByUser)
                .Include(rp => rp.RevokedByUser)
                .Where(rp => rp.RoleId == roleId)
                .OrderByDescending(rp => rp.GrantedAt)
                .ToListAsync(cancellationToken);
        }

        // User roles
        public async Task<IEnumerable<UserRole>> GetUserRolesAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserId == userId && ur.RevokedAt == null)
                .ToListAsync(cancellationToken);
        }

        public async Task<UserRole?> GetUserRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default)
        {
            return await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.Role == roleName, cancellationToken);
        }

        public async Task<UserRole> AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default)
        {
            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync(cancellationToken);
            return userRole;
        }

        public async Task UpdateUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default)
        {
            _context.UserRoles.Update(userRole);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteUserRoleAsync(string id, CancellationToken cancellationToken = default)
        {
            var userRole = await _context.UserRoles.FindAsync(new object[] { id }, cancellationToken);
            if (userRole != null)
            {
                _context.UserRoles.Remove(userRole);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // Utility methods
        public async Task<bool> UserHasPermissionAsync(string userId, string permissionName, string? resourceId = null, CancellationToken cancellationToken = default)
        {
            // Check direct user permissions
            var hasDirectPermission = await _context.UserPermissions
                .AnyAsync(up => up.UserId == userId &&
                               up.Permission.Name == permissionName &&
                               up.IsActive &&
                               up.IsGranted &&
                               (resourceId == null || up.ResourceId == resourceId) &&
                               (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow), cancellationToken);

            if (hasDirectPermission) return true;

            // Check permissions from roles
            var userRoleNames = await GetUserRoleNamesAsync(userId, cancellationToken);
            
            foreach (var roleName in userRoleNames)
            {
                var role = await GetRoleByNameAsync(roleName, cancellationToken);
                if (role != null && role.HasPermission(permissionName))
                {
                    return true;
                }
            }

            return false;
        }

        public async Task<bool> UserHasRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default)
        {
            return await _context.UserRoles
                .AnyAsync(ur => ur.UserId == userId &&
                              ur.Role == roleName &&
                              ur.RevokedAt == null, cancellationToken);
        }

        public async Task<bool> RoleHasPermissionAsync(string roleId, string permissionName, CancellationToken cancellationToken = default)
        {
            var role = await GetRoleByIdAsync(roleId, cancellationToken);
            return role?.HasPermission(permissionName) ?? false;
        }

        public async Task<IEnumerable<string>> GetUserPermissionNamesAsync(string userId, CancellationToken cancellationToken = default)
        {
            var permissions = new HashSet<string>();

            // Get direct user permissions
            var directPermissions = await _context.UserPermissions
                .Include(up => up.Permission)
                .Where(up => up.UserId == userId &&
                           up.IsActive &&
                           up.IsGranted &&
                           (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow))
                .Select(up => up.Permission.Name)
                .ToListAsync(cancellationToken);

            foreach (var permission in directPermissions)
            {
                permissions.Add(permission);
            }

            // Get permissions from roles
            var userRoleNames = await GetUserRoleNamesAsync(userId, cancellationToken);
            
            foreach (var roleName in userRoleNames)
            {
                var role = await GetRoleByNameAsync(roleName, cancellationToken);
                if (role != null)
                {
                    var rolePermissions = role.GetAllPermissions();
                    foreach (var permission in rolePermissions)
                    {
                        permissions.Add(permission.Name);
                    }
                }
            }

            return permissions;
        }

        public async Task<Dictionary<string, List<string>>> GetUserPermissionsByCategoryAsync(string userId, CancellationToken cancellationToken = default)
        {
            var permissionsByCategory = new Dictionary<string, List<string>>();
            
            // Get all user permissions with categories
            var userPermissions = await GetUserPermissionNamesAsync(userId, cancellationToken);
            
            // Get permission details to group by category
            var permissions = await _context.Permissions
                .Where(p => userPermissions.Contains(p.Name))
                .ToListAsync(cancellationToken);
            
            foreach (var permission in permissions)
            {
                if (!permissionsByCategory.ContainsKey(permission.Category))
                {
                    permissionsByCategory[permission.Category] = new List<string>();
                }
                permissionsByCategory[permission.Category].Add(permission.Name);
            }
            
            return permissionsByCategory;
        }
        
        public async Task<IEnumerable<string>> GetUserRoleNamesAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserId == userId && ur.RevokedAt == null)
                .Select(ur => ur.Role)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<string>> GetRolePermissionNamesAsync(string roleId, CancellationToken cancellationToken = default)
        {
            var role = await GetRoleByIdAsync(roleId, cancellationToken);
            if (role == null) return Enumerable.Empty<string>();

            return role.GetAllPermissions().Select(p => p.Name);
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        // High-level operations implementation
        public async Task<bool> UserHasAnyPermissionAsync(string userId, string[] permissionNames, CancellationToken cancellationToken = default)
        {
            foreach (var permissionName in permissionNames)
            {
                if (await UserHasPermissionAsync(userId, permissionName, null, cancellationToken))
                    return true;
            }
            return false;
        }

        public async Task<bool> UserHasAllPermissionsAsync(string userId, string[] permissionNames, CancellationToken cancellationToken = default)
        {
            foreach (var permissionName in permissionNames)
            {
                if (!await UserHasPermissionAsync(userId, permissionName, null, cancellationToken))
                    return false;
            }
            return true;
        }

        public async Task AssignRoleToUserAsync(Guid userId, string roleName, Guid? assignedBy = null, string? reason = null, CancellationToken cancellationToken = default)
        {
            var role = await GetRoleByNameAsync(roleName, cancellationToken);
            if (role == null)
                throw new ArgumentException("Role not found", nameof(roleName));

            var existingUserRole = await GetUserRoleAsync(userId.ToString(), roleName, cancellationToken);

            if (existingUserRole != null)
            {
                if (existingUserRole.RevokedAt.HasValue)
                {
                    // Reactivate the role
                    existingUserRole.RevokedAt = null;
                    existingUserRole.RevokedBy = null;
                    existingUserRole.AssignedAt = DateTime.UtcNow;
                    existingUserRole.AssignedBy = assignedBy?.ToString();
                    await UpdateUserRoleAsync(existingUserRole, cancellationToken);
                }
            }
            else
            {
                var userRole = new UserRole
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId.ToString(),
                    Role = roleName,
                    AssignedAt = DateTime.UtcNow,
                    AssignedBy = assignedBy?.ToString()
                };
                await AddUserRoleAsync(userRole, cancellationToken);
            }

            _logger.LogInformation("Assigned role {Role} to user {UserId}", roleName, userId);
        }

        public async Task RemoveRoleFromUserAsync(Guid userId, string roleName, Guid? removedBy = null, string? reason = null, CancellationToken cancellationToken = default)
        {
            var userRole = await GetUserRoleAsync(userId.ToString(), roleName, cancellationToken);
            if (userRole != null && !userRole.RevokedAt.HasValue)
            {
                userRole.RevokedAt = DateTime.UtcNow;
                userRole.RevokedBy = removedBy?.ToString();
                await UpdateUserRoleAsync(userRole, cancellationToken);
            }

            _logger.LogInformation("Removed role {Role} from user {UserId}", roleName, userId);
        }

        public async Task GrantPermissionToUserAsync(Guid userId, string permissionName, Guid? grantedBy = null, DateTime? expiresAt = null, string? resourceId = null, string? reason = null, CancellationToken cancellationToken = default)
        {
            var permission = await GetPermissionByNameAsync(permissionName, cancellationToken);
            if (permission == null)
                throw new ArgumentException("Permission not found", nameof(permissionName));

            // Check if permission already exists
            var existingPermission = await GetUserPermissionAsync(
                userId.ToString(), permission.Id, resourceId, cancellationToken);

            if (existingPermission != null)
            {
                if (!existingPermission.IsActive || !existingPermission.IsGranted)
                {
                    // Reactivate existing permission
                    existingPermission.IsActive = true;
                    existingPermission.IsGranted = true;
                    existingPermission.GrantedAt = DateTime.UtcNow;
                    existingPermission.GrantedBy = grantedBy?.ToString();
                    existingPermission.Reason = reason;
                    existingPermission.UpdatedAt = DateTime.UtcNow;
                }
                if (expiresAt.HasValue)
                {
                    existingPermission.UpdateExpiration(expiresAt);
                }
                await UpdateUserPermissionAsync(existingPermission, cancellationToken);
            }
            else
            {
                var userPermission = UserPermission.Create(
                    userId.ToString(),
                    permission.Id,
                    true,
                    grantedBy?.ToString(),
                    expiresAt,
                    resourceId,
                    null,
                    reason);
                await AddUserPermissionAsync(userPermission, cancellationToken);
            }

            _logger.LogInformation("Granted permission {Permission} to user {UserId}", permissionName, userId);
        }

        public async Task RevokePermissionFromUserAsync(Guid userId, string permissionName, Guid? revokedBy = null, string? reason = null, CancellationToken cancellationToken = default)
        {
            var permission = await GetPermissionByNameAsync(permissionName, cancellationToken);
            if (permission == null) return;

            var userPermissions = await GetUserPermissionsAsync(userId.ToString(), cancellationToken);
            var permissionsToRevoke = userPermissions
                .Where(up => up.PermissionId == permission.Id && up.IsActive);

            foreach (var userPermission in permissionsToRevoke)
            {
                userPermission.Revoke(revokedBy?.ToString(), reason);
                await UpdateUserPermissionAsync(userPermission, cancellationToken);
            }

            _logger.LogInformation("Revoked permission {Permission} from user {UserId}", permissionName, userId);
        }

        public async Task GrantPermissionToRoleAsync(Guid roleId, string permissionName, Guid? grantedBy = null, string? reason = null, CancellationToken cancellationToken = default)
        {
            var role = await GetRoleByIdAsync(roleId.ToString(), cancellationToken);
            if (role == null)
                throw new ArgumentException("Role not found", nameof(roleId));

            var permission = await GetPermissionByNameAsync(permissionName, cancellationToken);
            if (permission == null)
                throw new ArgumentException("Permission not found", nameof(permissionName));

            var existingPermission = await GetRolePermissionAsync(roleId.ToString(), permission.Id, cancellationToken);

            if (existingPermission != null)
            {
                if (!existingPermission.IsActive)
                {
                    existingPermission.Reactivate(grantedBy?.ToString(), reason);
                    await UpdateRolePermissionAsync(existingPermission, cancellationToken);
                }
            }
            else
            {
                var rolePermission = RolePermission.Create(
                    roleId.ToString(),
                    permission.Id,
                    grantedBy?.ToString(),
                    reason);
                await AddRolePermissionAsync(rolePermission, cancellationToken);
            }

            _logger.LogInformation("Granted permission {Permission} to role {RoleId}", permissionName, roleId);
        }

        public async Task RevokePermissionFromRoleAsync(Guid roleId, string permissionName, Guid? revokedBy = null, string? reason = null, CancellationToken cancellationToken = default)
        {
            var permission = await GetPermissionByNameAsync(permissionName, cancellationToken);
            if (permission == null) return;

            var rolePermission = await GetRolePermissionAsync(roleId.ToString(), permission.Id, cancellationToken);
            if (rolePermission != null && rolePermission.IsActive)
            {
                rolePermission.Revoke(revokedBy?.ToString(), reason);
                await UpdateRolePermissionAsync(rolePermission, cancellationToken);
            }

            _logger.LogInformation("Revoked permission {Permission} from role {RoleId}", permissionName, roleId);
        }

        public async Task<Role> CreateRoleAsync(string name, string description, int priority = 0, Guid? parentRoleId = null, CancellationToken cancellationToken = default)
        {
            var existingRole = await GetRoleByNameAsync(name, cancellationToken);
            if (existingRole != null)
                throw new ArgumentException("Role already exists", nameof(name));

            var role = Role.Create(name, description, priority, false, parentRoleId?.ToString());
            await AddRoleAsync(role, cancellationToken);

            _logger.LogInformation("Created role {Role}", name);
            return role;
        }

        public async Task SyncUserPermissionsAsync(Guid userId, IEnumerable<string> permissionNames, CancellationToken cancellationToken = default)
        {
            var currentPermissions = await GetUserPermissionNamesAsync(userId.ToString(), cancellationToken);
            var targetPermissions = new HashSet<string>(permissionNames);

            // Revoke permissions that are not in the target list
            var toRevoke = currentPermissions.Where(p => !targetPermissions.Contains(p));
            foreach (var permissionName in toRevoke)
            {
                await RevokePermissionFromUserAsync(userId, permissionName, null, "Permission sync", cancellationToken);
            }

            // Grant permissions that are in the target list but not current
            var toGrant = targetPermissions.Where(p => !currentPermissions.Contains(p));
            foreach (var permissionName in toGrant)
            {
                await GrantPermissionToUserAsync(userId, permissionName, null, null, null, "Permission sync", cancellationToken);
            }
        }

        public async Task<IEnumerable<Permission>> GetUserPermissionsWithRolesAsync(string userId, CancellationToken cancellationToken = default)
        {
            var permissions = new HashSet<Permission>();

            // Get direct user permissions
            var userPermissions = await GetUserPermissionsAsync(userId, cancellationToken);
            foreach (var up in userPermissions)
            {
                if (up.Permission != null)
                    permissions.Add(up.Permission);
            }

            // Get permissions from roles
            var userRoleNames = await GetUserRoleNamesAsync(userId, cancellationToken);
            foreach (var roleName in userRoleNames)
            {
                var role = await GetRoleByNameAsync(roleName, cancellationToken);
                if (role != null)
                {
                    var rolePermissions = role.GetAllPermissions();
                    foreach (var permission in rolePermissions)
                    {
                        permissions.Add(permission);
                    }
                }
            }

            return permissions;
        }

        public async Task<IEnumerable<Permission>> GetRolePermissionsWithInheritanceAsync(string roleId, CancellationToken cancellationToken = default)
        {
            var role = await GetRoleByIdAsync(roleId, cancellationToken);
            if (role == null) return Enumerable.Empty<Permission>();

            return role.GetAllPermissions();
        }
    }
}
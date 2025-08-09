using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UserService.Domain.Models;

namespace UserService.Domain.Repositories
{
    public interface IPermissionRepository
    {
        // Permission operations
        Task<Permission?> GetPermissionByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<Permission?> GetPermissionByNameAsync(string name, CancellationToken cancellationToken = default);
        Task<IEnumerable<Permission>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);
        Task<IEnumerable<Permission>> GetPermissionsByCategoryAsync(string category, CancellationToken cancellationToken = default);
        Task<Permission> AddPermissionAsync(Permission permission, CancellationToken cancellationToken = default);
        Task UpdatePermissionAsync(Permission permission, CancellationToken cancellationToken = default);
        Task DeletePermissionAsync(string id, CancellationToken cancellationToken = default);

        // Role operations
        Task<Role?> GetRoleByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<Role?> GetRoleByNameAsync(string name, CancellationToken cancellationToken = default);
        Task<IEnumerable<Role>> GetAllRolesAsync(CancellationToken cancellationToken = default);
        Task<Role> AddRoleAsync(Role role, CancellationToken cancellationToken = default);
        Task UpdateRoleAsync(Role role, CancellationToken cancellationToken = default);
        Task DeleteRoleAsync(string id, CancellationToken cancellationToken = default);

        // User permissions
        Task<IEnumerable<UserPermission>> GetUserPermissionsAsync(string userId, CancellationToken cancellationToken = default);
        Task<UserPermission?> GetUserPermissionAsync(string userId, string permissionId, string? resourceId = null, CancellationToken cancellationToken = default);
        Task<UserPermission> AddUserPermissionAsync(UserPermission userPermission, CancellationToken cancellationToken = default);
        Task UpdateUserPermissionAsync(UserPermission userPermission, CancellationToken cancellationToken = default);
        Task DeleteUserPermissionAsync(string id, CancellationToken cancellationToken = default);
        Task<IEnumerable<UserPermission>> GetUserPermissionHistoryAsync(string userId, CancellationToken cancellationToken = default);

        // Role permissions
        Task<IEnumerable<RolePermission>> GetRolePermissionsAsync(string roleId, CancellationToken cancellationToken = default);
        Task<RolePermission?> GetRolePermissionAsync(string roleId, string permissionId, CancellationToken cancellationToken = default);
        Task<RolePermission> AddRolePermissionAsync(RolePermission rolePermission, CancellationToken cancellationToken = default);
        Task UpdateRolePermissionAsync(RolePermission rolePermission, CancellationToken cancellationToken = default);
        Task DeleteRolePermissionAsync(string id, CancellationToken cancellationToken = default);
        Task<IEnumerable<RolePermission>> GetRolePermissionHistoryAsync(string roleId, CancellationToken cancellationToken = default);

        // User roles
        Task<IEnumerable<UserRole>> GetUserRolesAsync(string userId, CancellationToken cancellationToken = default);
        Task<UserRole?> GetUserRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default);
        Task<UserRole> AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default);
        Task UpdateUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default);
        Task DeleteUserRoleAsync(string id, CancellationToken cancellationToken = default);

        // Utility methods
        Task<bool> UserHasPermissionAsync(string userId, string permissionName, string? resourceId = null, CancellationToken cancellationToken = default);
        Task<bool> UserHasRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default);
        Task<bool> RoleHasPermissionAsync(string roleId, string permissionName, CancellationToken cancellationToken = default);
        Task<IEnumerable<string>> GetUserPermissionNamesAsync(string userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<string>> GetUserRoleNamesAsync(string userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<string>> GetRolePermissionNamesAsync(string roleId, CancellationToken cancellationToken = default);

        // Save changes
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

        // High-level operations
        Task<bool> UserHasAnyPermissionAsync(string userId, string[] permissionNames, CancellationToken cancellationToken = default);
        Task<bool> UserHasAllPermissionsAsync(string userId, string[] permissionNames, CancellationToken cancellationToken = default);
        Task AssignRoleToUserAsync(Guid userId, string roleName, Guid? assignedBy = null, string? reason = null, CancellationToken cancellationToken = default);
        Task RemoveRoleFromUserAsync(Guid userId, string roleName, Guid? removedBy = null, string? reason = null, CancellationToken cancellationToken = default);
        Task GrantPermissionToUserAsync(Guid userId, string permissionName, Guid? grantedBy = null, DateTime? expiresAt = null, string? resourceId = null, string? reason = null, CancellationToken cancellationToken = default);
        Task RevokePermissionFromUserAsync(Guid userId, string permissionName, Guid? revokedBy = null, string? reason = null, CancellationToken cancellationToken = default);
        Task GrantPermissionToRoleAsync(Guid roleId, string permissionName, Guid? grantedBy = null, string? reason = null, CancellationToken cancellationToken = default);
        Task RevokePermissionFromRoleAsync(Guid roleId, string permissionName, Guid? revokedBy = null, string? reason = null, CancellationToken cancellationToken = default);
        Task<Role> CreateRoleAsync(string name, string description, int priority = 0, Guid? parentRoleId = null, CancellationToken cancellationToken = default);
        Task SyncUserPermissionsAsync(Guid userId, IEnumerable<string> permissionNames, CancellationToken cancellationToken = default);
        Task<IEnumerable<Permission>> GetUserPermissionsWithRolesAsync(string userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Permission>> GetRolePermissionsWithInheritanceAsync(string roleId, CancellationToken cancellationToken = default);
    }
}
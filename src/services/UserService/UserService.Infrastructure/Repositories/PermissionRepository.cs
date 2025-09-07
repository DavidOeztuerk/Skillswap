using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Infrastructure.Repositories;

public class PermissionRepository : IPermissionRepository
{
    private readonly UserDbContext _context;
    private readonly ILogger<PermissionRepository> _logger;

    public PermissionRepository(UserDbContext context, ILogger<PermissionRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ---------- Permission ----------
    public async Task<Permission?> GetPermissionByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _context.Permissions
            .Include(p => p.RolePermissions)
            .Include(p => p.UserPermissions)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<Permission?> GetPermissionByNameAsync(string name, CancellationToken cancellationToken = default) =>
        await _context.Permissions.FirstOrDefaultAsync(p => p.Name == name && p.IsActive, cancellationToken);

    public async Task<IEnumerable<Permission>> GetAllPermissionsAsync(CancellationToken cancellationToken = default) =>
        await _context.Permissions
            .Where(p => p.IsActive)
            .OrderBy(p => p.Category).ThenBy(p => p.Name)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<Permission>> GetPermissionsByCategoryAsync(string category, CancellationToken cancellationToken = default) =>
        await _context.Permissions
            .Where(p => p.Category == category && p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);

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
        if (permission is null) return;
        permission.Deactivate(); // Soft delete
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ---------- Role ----------
    public async Task<Role?> GetRoleByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _context.Roles
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .Include(r => r.ParentRole)
            .Include(r => r.ChildRoles)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<Role?> GetRoleByNameAsync(string name, CancellationToken cancellationToken = default) =>
        await _context.Roles
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Name == name && r.IsActive, cancellationToken);

    public async Task<IEnumerable<Role>> GetAllRolesAsync(CancellationToken cancellationToken = default) =>
        await _context.Roles
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.Priority).ThenBy(r => r.Name)
            .ToListAsync(cancellationToken);

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
        if (role is null || role.IsSystemRole) return;
        role.Deactivate(); // Soft delete
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ---------- UserPermissions ----------
    public async Task<IEnumerable<UserPermission>> GetUserPermissionsAsync(string userId, CancellationToken cancellationToken = default) =>
        await _context.UserPermissions
            .Include(up => up.Permission)
            .Where(up => up.UserId == userId
                         && up.IsActive
                         && up.IsGranted
                         && (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow))
            .ToListAsync(cancellationToken);

    public async Task<UserPermission?> GetUserPermissionAsync(string userId, string permissionId, string? resourceId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.UserPermissions
            .Include(up => up.Permission)
            .Where(up => up.UserId == userId && up.PermissionId == permissionId);

        if (!string.IsNullOrEmpty(resourceId))
            query = query.Where(up => up.ResourceId == resourceId);

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
        var entity = await _context.UserPermissions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return;
        _context.UserPermissions.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<UserPermission>> GetUserPermissionHistoryAsync(string userId, CancellationToken cancellationToken = default) =>
        await _context.UserPermissions
            .Include(up => up.Permission)
            .Include(up => up.GrantedBy)
            .Include(up => up.RevokedBy)
            .Where(up => up.UserId == userId)
            .OrderByDescending(up => up.GrantedAt)
            .ToListAsync(cancellationToken);

    // ---------- RolePermissions ----------
    public async Task<IEnumerable<RolePermission>> GetRolePermissionsAsync(string roleId, CancellationToken cancellationToken = default) =>
        await _context.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => rp.RoleId == roleId && rp.IsActive)
            .ToListAsync(cancellationToken);

    public async Task<RolePermission?> GetRolePermissionAsync(string roleId, string permissionId, CancellationToken cancellationToken = default) =>
        await _context.RolePermissions
            .Include(rp => rp.Permission)
            .FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, cancellationToken);

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
        var entity = await _context.RolePermissions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return;
        _context.RolePermissions.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolePermission>> GetRolePermissionHistoryAsync(string roleId, CancellationToken cancellationToken = default) =>
        await _context.RolePermissions
            .Include(rp => rp.Permission)
            .Include(rp => rp.GrantedByUser)
            .Include(rp => rp.RevokedByUser)
            .Where(rp => rp.RoleId == roleId)
            .OrderByDescending(rp => rp.GrantedAt)
            .ToListAsync(cancellationToken);

    // ---------- UserRoles ----------
    public async Task<IEnumerable<UserRole>> GetUserRolesAsync(string userId, CancellationToken cancellationToken = default) =>
        await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == userId && ur.RevokedAt == null)
            .ToListAsync(cancellationToken);

    public async Task<UserRole?> GetUserRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default) =>
        await _context.UserRoles
            .Include(ur => ur.Role)
            .FirstOrDefaultAsync(ur => ur.UserId == userId
                                       && ur.RevokedAt == null
                                       && ur.Role.Name == roleName, cancellationToken);

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
        var entity = await _context.UserRoles.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return;
        _context.UserRoles.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ---------- Utils ----------
    public async Task<bool> UserHasPermissionAsync(string userId, string permissionName, string? resourceId = null, CancellationToken cancellationToken = default)
    {
        // direkt
        var hasDirect = await _context.UserPermissions
            .AnyAsync(up => up.UserId == userId
                            && up.Permission.Name == permissionName
                            && up.IsActive
                            && up.IsGranted
                            && (resourceId == null || up.ResourceId == resourceId)
                            && (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow), cancellationToken);
        if (hasDirect) return true;

        // aus Rollen (inkl. Vererbung in Role.HasPermission)
        var roleNames = await GetUserRoleNamesAsync(userId, cancellationToken);
        foreach (var roleName in roleNames)
        {
            var role = await GetRoleByNameAsync(roleName, cancellationToken);
            if (role != null && role.HasPermission(permissionName))
                return true;
        }
        return false;
    }

    public async Task<bool> UserHasRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default) =>
        await _context.UserRoles
            .Include(ur => ur.Role)
            .AnyAsync(ur => ur.UserId == userId
                            && ur.RevokedAt == null
                            && ur.Role.Name == roleName, cancellationToken);

    public async Task<bool> RoleHasPermissionAsync(string roleId, string permissionName, CancellationToken cancellationToken = default)
    {
        var role = await GetRoleByIdAsync(roleId, cancellationToken);
        return role?.HasPermission(permissionName) ?? false;
    }

    public async Task<IEnumerable<string>> GetUserPermissionNamesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var names = new HashSet<string>(StringComparer.Ordinal);

        var direct = await _context.UserPermissions
            .Include(up => up.Permission)
            .Where(up => up.UserId == userId
                         && up.IsActive
                         && up.IsGranted
                         && (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow))
            .Select(up => up.Permission.Name)
            .ToListAsync(cancellationToken);
        foreach (var p in direct) names.Add(p);

        var roleNames = await GetUserRoleNamesAsync(userId, cancellationToken);
        foreach (var rn in roleNames)
        {
            var role = await GetRoleByNameAsync(rn, cancellationToken);
            if (role is null) continue;
            foreach (var p in role.GetAllPermissions()) names.Add(p.Name);
        }

        return names;
    }

    public async Task<Dictionary<string, List<string>>> GetUserPermissionsByCategoryAsync(string userId, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        var names = await GetUserPermissionNamesAsync(userId, cancellationToken);
        var perms = await _context.Permissions
            .Where(p => names.Contains(p.Name))
            .Select(p => new { p.Category, p.Name })
            .ToListAsync(cancellationToken);

        foreach (var p in perms)
        {
            if (!result.TryGetValue(p.Category, out var list))
                result[p.Category] = list = new List<string>();
            list.Add(p.Name);
        }

        return result;
    }

    public async Task<IEnumerable<string>> GetUserRoleNamesAsync(string userId, CancellationToken cancellationToken = default) =>
        await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == userId && ur.RevokedAt == null)
            .Select(ur => ur.Role.Name)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<string>> GetRolePermissionNamesAsync(string roleId, CancellationToken cancellationToken = default)
    {
        var role = await GetRoleByIdAsync(roleId, cancellationToken);
        if (role is null) return Enumerable.Empty<string>();
        return role.GetAllPermissions().Select(p => p.Name);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await _context.SaveChangesAsync(cancellationToken);

    public async Task<bool> UserHasAnyPermissionAsync(string userId, IEnumerable<string> permissionNames, CancellationToken cancellationToken = default)
    {
        foreach (var name in permissionNames)
            if (await UserHasPermissionAsync(userId, name, null, cancellationToken)) return true;
        return false;
    }

    public async Task<bool> UserHasAllPermissionsAsync(string userId, IEnumerable<string> permissionNames, CancellationToken cancellationToken = default)
    {
        foreach (var name in permissionNames)
            if (!await UserHasPermissionAsync(userId, name, null, cancellationToken)) return false;
        return true;
    }

    public async Task AssignRoleToUserAsync(Guid userId, string roleName, Guid? assignedBy = null, string? reason = null, CancellationToken cancellationToken = default)
    {
        var role = await GetRoleByNameAsync(roleName, cancellationToken)
                   ?? throw new ResourceNotFoundException("Role", roleName);

        var existing = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId.ToString()
                                       && ur.RoleId == role.Id
                                       && ur.RevokedAt == null, cancellationToken);

        if (existing is null)
        {
            await AddUserRoleAsync(new UserRole
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId.ToString(),
                RoleId = role.Id,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = assignedBy?.ToString()
            }, cancellationToken);
        }
        else
        {
            // already active -> no-op
        }

        _logger.LogInformation("Assigned role {Role} to user {UserId}", roleName, userId);
    }

    public async Task RemoveRoleFromUserAsync(Guid userId, string roleName, Guid? removedBy = null, string? reason = null, CancellationToken cancellationToken = default)
    {
        var role = await GetRoleByNameAsync(roleName, cancellationToken);
        if (role is null) return;

        var link = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId.ToString()
                                       && ur.RoleId == role.Id
                                       && ur.RevokedAt == null, cancellationToken);
        if (link is not null)
        {
            link.RevokedAt = DateTime.UtcNow;
            link.RevokedBy = removedBy?.ToString();
            await UpdateUserRoleAsync(link, cancellationToken);
        }

        _logger.LogInformation("Removed role {Role} from user {UserId}", roleName, userId);
    }

    public async Task GrantPermissionToUserAsync(Guid userId, string permissionName, Guid? grantedBy = null, DateTime? expiresAt = null, string? resourceId = null, string? reason = null, CancellationToken cancellationToken = default)
    {
        var permission = await GetPermissionByNameAsync(permissionName, cancellationToken)
                         ?? throw new ResourceNotFoundException("Permission", permissionName);

        var existing = await GetUserPermissionAsync(userId.ToString(), permission.Id, resourceId, cancellationToken);
        if (existing is not null)
        {
            if (!existing.IsActive || !existing.IsGranted)
            {
                existing.IsActive = true;
                existing.IsGranted = true;
                existing.GrantedAt = DateTime.UtcNow;
                existing.GrantedBy = grantedBy?.ToString();
                existing.Reason = reason;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            if (expiresAt.HasValue) existing.UpdateExpiration(expiresAt);
            await UpdateUserPermissionAsync(existing, cancellationToken);
        }
        else
        {
            var up = UserPermission.Create(
                userId.ToString(), permission.Id, true, grantedBy?.ToString(),
                expiresAt, resourceId, null, reason);
            await AddUserPermissionAsync(up, cancellationToken);
        }

        _logger.LogInformation("Granted permission {Permission} to user {UserId}", permissionName, userId);
    }

    public async Task RevokePermissionFromUserAsync(Guid userId, string permissionName, Guid? revokedBy = null, string? reason = null, CancellationToken cancellationToken = default)
    {
        var permission = await GetPermissionByNameAsync(permissionName, cancellationToken);
        if (permission is null) return;

        var items = await _context.UserPermissions
            .Where(up => up.UserId == userId.ToString()
                         && up.PermissionId == permission.Id
                         && up.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var up in items)
        {
            up.Revoke(revokedBy?.ToString(), reason);
            await UpdateUserPermissionAsync(up, cancellationToken);
        }

        _logger.LogInformation("Revoked permission {Permission} from user {UserId}", permissionName, userId);
    }

    public async Task GrantPermissionToRoleAsync(Guid roleId, string permissionName, Guid? grantedBy = null, string? reason = null, CancellationToken cancellationToken = default)
    {
        var role = await GetRoleByIdAsync(roleId.ToString(), cancellationToken)
                   ?? throw new ResourceNotFoundException("Role", roleId.ToString());

        var permission = await GetPermissionByNameAsync(permissionName, cancellationToken)
                         ?? throw new ResourceNotFoundException("Permission", permissionName);

        var existing = await GetRolePermissionAsync(roleId.ToString(), permission.Id, cancellationToken);
        if (existing is not null)
        {
            if (!existing.IsActive)
            {
                existing.Reactivate(grantedBy?.ToString(), reason);
                await UpdateRolePermissionAsync(existing, cancellationToken);
            }
        }
        else
        {
            var rp = RolePermission.Create(roleId.ToString(), permission.Id, grantedBy?.ToString(), reason);
            await AddRolePermissionAsync(rp, cancellationToken);
        }

        _logger.LogInformation("Granted permission {Permission} to role {RoleId}", permissionName, roleId);
    }

    public async Task RevokePermissionFromRoleAsync(Guid roleId, string permissionName, Guid? revokedBy = null, string? reason = null, CancellationToken cancellationToken = default)
    {
        var permission = await GetPermissionByNameAsync(permissionName, cancellationToken);
        if (permission is null) return;

        var rp = await GetRolePermissionAsync(roleId.ToString(), permission.Id, cancellationToken);
        if (rp is not null && rp.IsActive)
        {
            rp.Revoke(revokedBy?.ToString(), reason);
            await UpdateRolePermissionAsync(rp, cancellationToken);
        }

        _logger.LogInformation("Revoked permission {Permission} from role {RoleId}", permissionName, roleId);
    }

    public async Task<Role> CreateRoleAsync(string name, string description, int priority = 0, Guid? parentRoleId = null, CancellationToken cancellationToken = default)
    {
        if (await GetRoleByNameAsync(name, cancellationToken) is not null)
            throw new ResourceAlreadyExistsException("Role", "name", name);

        var role = Role.Create(name, description, priority, false, parentRoleId?.ToString());
        await AddRoleAsync(role, cancellationToken);
        _logger.LogInformation("Created role {Role}", name);
        return role;
    }

    public async Task SyncUserPermissionsAsync(Guid userId, IEnumerable<string> permissionNames, CancellationToken cancellationToken = default)
    {
        var current = await GetUserPermissionNamesAsync(userId.ToString(), cancellationToken);
        var target = new HashSet<string>(permissionNames);

        var toRevoke = current.Where(p => !target.Contains(p));
        foreach (var p in toRevoke)
            await RevokePermissionFromUserAsync(userId, p, null, "Permission sync", cancellationToken);

        var toGrant = target.Where(p => !current.Contains(p));
        foreach (var p in toGrant)
            await GrantPermissionToUserAsync(userId, p, null, null, null, "Permission sync", cancellationToken);
    }

    public async Task<IEnumerable<Permission>> GetUserPermissionsWithRolesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var set = new HashSet<Permission>();

        var ups = await GetUserPermissionsAsync(userId, cancellationToken);
        foreach (var up in ups)
            if (up.Permission is not null) set.Add(up.Permission);

        var roleNames = await GetUserRoleNamesAsync(userId, cancellationToken);
        foreach (var rn in roleNames)
        {
            var role = await GetRoleByNameAsync(rn, cancellationToken);
            if (role is null) continue;
            foreach (var p in role.GetAllPermissions()) set.Add(p);
        }

        return set;
    }

    public async Task<IEnumerable<Permission>> GetRolePermissionsWithInheritanceAsync(string roleId, CancellationToken cancellationToken = default)
    {
        var role = await GetRoleByIdAsync(roleId, cancellationToken);
        if (role is null) return Enumerable.Empty<Permission>();
        return role.GetAllPermissions();
    }
}

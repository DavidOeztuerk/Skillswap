using Domain.Abstractions;

namespace UserService.Domain.Models;

public class Role : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsSystemRole { get; set; }
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } // Higher priority = more important
    public string? ParentRoleId { get; set; } // For role hierarchy

    // Navigation properties
    public virtual Role? ParentRole { get; set; }
    public virtual ICollection<Role> ChildRoles { get; set; } = [];
    public virtual ICollection<UserRole> UserRoles { get; set; } = [];
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = [];

    private Role() { }

    public static Role Create(
        string name,
        string description,
        int priority = 0,
        bool isSystemRole = false,
        string? parentRoleId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Role name is required", nameof(name));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Role description is required", nameof(description));

        return new Role
        {
            Id = Guid.NewGuid().ToString(),
            Name = name,
            Description = description,
            Priority = priority,
            IsSystemRole = isSystemRole,
            ParentRoleId = parentRoleId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void UpdateDetails(string description, int priority)
    {
        if (IsSystemRole)
            throw new InvalidOperationException("Cannot modify system roles");

        Description = description;
        Priority = priority;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetParentRole(string? parentRoleId)
    {
        if (IsSystemRole)
            throw new InvalidOperationException("Cannot modify system roles");

        if (parentRoleId == Id)
            throw new InvalidOperationException("Role cannot be its own parent");

        ParentRoleId = parentRoleId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        if (IsSystemRole)
            throw new InvalidOperationException("Cannot deactivate system roles");

        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool HasPermission(string permissionName)
    {
        // Check direct permissions
        if (RolePermissions.Any(rp => rp.Permission.Name == permissionName && rp.IsActive))
            return true;

        // Check inherited permissions from parent role
        if (ParentRole != null)
            return ParentRole.HasPermission(permissionName);

        return false;
    }

    public IEnumerable<Permission> GetAllPermissions()
    {
        var permissions = new HashSet<Permission>();

        // Get direct permissions
        foreach (var rp in RolePermissions.Where(rp => rp.IsActive))
        {
            permissions.Add(rp.Permission);
        }

        // Get inherited permissions
        if (ParentRole != null)
        {
            foreach (var permission in ParentRole.GetAllPermissions())
            {
                permissions.Add(permission);
            }
        }

        return permissions;
    }
}
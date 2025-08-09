using Domain.Abstractions;

namespace UserService.Domain.Models;

public class Permission : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public bool IsSystemPermission { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = [];
    public virtual ICollection<UserPermission> UserPermissions { get; set; } = [];

    private Permission() { }

    public static Permission Create(
        string name,
        string category,
        string description,
        string resource = "",
        bool isSystemPermission = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Permission name is required", nameof(name));

        if (string.IsNullOrWhiteSpace(category))
            throw new ArgumentException("Permission category is required", nameof(category));

        return new Permission
        {
            Id = Guid.NewGuid().ToString(),
            Name = name,
            Category = category,
            Description = description,
            Resource = resource,
            IsSystemPermission = isSystemPermission,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(string description)
    {
        if (IsSystemPermission)
            throw new InvalidOperationException("Cannot modify system permissions");

        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }
}
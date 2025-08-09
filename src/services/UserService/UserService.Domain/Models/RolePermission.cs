using Domain.Abstractions;

namespace UserService.Domain.Models;

public class RolePermission : AuditableEntity
{
    public string? RoleId { get; set; }
    public string? PermissionId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime GrantedAt { get; set; }
    public string? GrantedBy { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedBy { get; set; }
    public string? Reason { get; set; }

    // Navigation properties
    public virtual Role Role { get; set; } = null!;
    public virtual Permission Permission { get; set; } = null!;
    public virtual User? GrantedByUser { get; set; }
    public virtual User? RevokedByUser { get; set; }

    private RolePermission() { }

    public static RolePermission Create(
        string roleId,
        string permissionId,
        string? grantedBy = null,
        string? reason = null)
    {
        return new RolePermission
        {
            Id = Guid.NewGuid().ToString(),
            RoleId = roleId,
            PermissionId = permissionId,
            GrantedAt = DateTime.UtcNow,
            GrantedBy = grantedBy,
            Reason = reason,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Revoke(string? revokedBy = null, string? reason = null)
    {
        IsActive = false;
        RevokedAt = DateTime.UtcNow;
        RevokedBy = revokedBy;
        Reason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reactivate(string? grantedBy = null, string? reason = null)
    {
        IsActive = true;
        RevokedAt = null;
        RevokedBy = null;
        GrantedAt = DateTime.UtcNow;
        GrantedBy = grantedBy;
        Reason = reason;
        UpdatedAt = DateTime.UtcNow;
    }
}
using Domain.Abstractions;

namespace UserService.Domain.Models;

public class UserPermission : AuditableEntity
{
    public string? UserId { get; set; }
    public string? PermissionId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsGranted { get; set; } = true; // Can be false to explicitly deny
    public DateTime GrantedAt { get; set; }
    public string? GrantedBy { get; set; }
    public DateTime? ExpiresAt { get; set; } // For temporary permissions
    public DateTime? RevokedAt { get; set; }
    public string? RevokedBy { get; set; }
    public string? Reason { get; set; }
    public string? ResourceId { get; set; } // For resource-specific permissions
    public string? Conditions { get; set; } // JSON for conditional permissions

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Permission Permission { get; set; } = null!;
    public virtual User? GrantedByUser { get; set; }
    public virtual User? RevokedByUser { get; set; }

    private UserPermission() { }

    public static UserPermission Create(
        string userId,
        string permissionId,
        bool isGranted = true,
        string? grantedBy = null,
        DateTime? expiresAt = null,
        string? resourceId = null,
        string? conditions = null,
        string? reason = null)
    {
        return new UserPermission
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            PermissionId = permissionId,
            IsGranted = isGranted,
            GrantedAt = DateTime.UtcNow,
            GrantedBy = grantedBy,
            ExpiresAt = expiresAt,
            ResourceId = resourceId,
            Conditions = conditions,
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

    public void UpdateExpiration(DateTime? expiresAt)
    {
        ExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateConditions(string? conditions)
    {
        Conditions = conditions;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsValid()
    {
        if (!IsActive) return false;
        if (ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow) return false;
        return true;
    }

    public bool IsExpired()
    {
        return ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;
    }
}
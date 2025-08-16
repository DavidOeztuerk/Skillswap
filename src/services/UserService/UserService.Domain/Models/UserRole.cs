using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// User roles with assignment tracking
/// </summary>
public class UserRole : AuditableEntity
{
    [Required, MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(450)]
    public string RoleId { get; set; } = string.Empty;

    [MaxLength(450)]
    public string? AssignedBy { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RevokedAt { get; set; }

    [MaxLength(450)]
    public string? RevokedBy { get; set; }

    public bool IsActive => RevokedAt == null && !IsDeleted;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Role Role { get; set; } = null!;
}

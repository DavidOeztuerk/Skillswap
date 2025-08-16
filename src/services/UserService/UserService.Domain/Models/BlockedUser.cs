using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

public class BlockedUser : AuditableEntity
{
    [Required, MaxLength(450)] public string UserId { get; set; } = string.Empty;
    [Required, MaxLength(450)] public string BlockedUserId { get; set; } = string.Empty;
    [MaxLength(1000)] public string? Reason { get; set; }
    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
    public virtual User BlockedUserRef { get; set; } = null!;
}

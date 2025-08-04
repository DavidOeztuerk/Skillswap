using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

public class BlockedUser : AuditableEntity
{
    [Required]
    public string? UserId { get; set; } = string.Empty;

    [Required]
    public string? BlockedUserId { get; set; } = string.Empty;

    public string? Reason { get; set; }

    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}

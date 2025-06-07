using Infrastructure.Models;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Active user sessions
/// </summary>
public class UserSession : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string SessionToken { get; set; } = string.Empty;

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [MaxLength(100)]
    public string? DeviceType { get; set; }

    [MaxLength(100)]
    public string? Location { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual User User { get; set; } = null!;

    // Helper properties
    public TimeSpan Duration => (EndedAt ?? DateTime.UtcNow) - StartedAt;
    public TimeSpan TimeSinceLastActivity => DateTime.UtcNow - LastActivity;
}

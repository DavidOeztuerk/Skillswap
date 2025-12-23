using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// Active user sessions with device fingerprinting and concurrent session control
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

    // Device Fingerprinting - for concurrent session control
    [MaxLength(500)]
    public string? DeviceFingerprint { get; set; }

    [MaxLength(100)]
    public string? Browser { get; set; }

    [MaxLength(100)]
    public string? OperatingSystem { get; set; }

    [MaxLength(50)]
    public string? ScreenResolution { get; set; }

    [MaxLength(50)]
    public string? TimeZone { get; set; }

    [MaxLength(100)]
    public string? Language { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);

    public bool IsActive { get; set; } = true;
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }

    [MaxLength(500)]
    public string? RevokedReason { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;

    // Helper properties
    public TimeSpan Duration => (EndedAt ?? DateTime.UtcNow) - StartedAt;
    public TimeSpan TimeSinceLastActivity => DateTime.UtcNow - LastActivity;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => IsActive && !IsRevoked && !IsExpired && !IsDeleted;
}

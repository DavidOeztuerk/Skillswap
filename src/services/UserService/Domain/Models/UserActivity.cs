using Infrastructure.Models;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// User activity logging
/// </summary>
public class UserActivity : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ActivityType { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    // Additional metadata as JSON
    public string? MetadataJson { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}

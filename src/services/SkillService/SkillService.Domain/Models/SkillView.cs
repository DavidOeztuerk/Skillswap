using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Skill view tracking for analytics
/// </summary>
public class SkillView : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [MaxLength(450)]
    public string? ViewerUserId { get; set; } // Null for anonymous views

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [MaxLength(500)]
    public string? Referrer { get; set; }

    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

    public int ViewDurationSeconds { get; set; } = 0;

    [MaxLength(50)]
    public string? ViewSource { get; set; } // "search", "recommendation", "direct", etc.

    // Navigation properties
    public virtual Skill Skill { get; set; } = null!;

    // Helper properties
    public bool IsAuthenticated => !string.IsNullOrEmpty(ViewerUserId);
    public bool IsLongView => ViewDurationSeconds > 30;
    public TimeSpan ViewDuration => TimeSpan.FromSeconds(ViewDurationSeconds);
}

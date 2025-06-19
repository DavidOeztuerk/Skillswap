using Infrastructure.Models;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Skill matching tracking
/// </summary>
public class SkillMatch : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string OfferedSkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string RequestedSkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string OfferingUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string RequestingUserId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = MatchStatus.Pending;

    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    // Match score and compatibility
    public double CompatibilityScore { get; set; } = 0.0;

    [MaxLength(200)]
    public string? MatchReason { get; set; }

    // Session details
    public DateTime? SessionDate { get; set; }
    public int? SessionDurationMinutes { get; set; }

    [MaxLength(50)]
    public string? SessionType { get; set; } // "video", "in-person", "text"

    // Navigation properties
    public virtual Skill OfferedSkill { get; set; } = null!;
    public virtual Skill RequestedSkill { get; set; } = null!;

    // Helper properties
    public bool IsCompleted => Status == MatchStatus.Completed;
    public bool IsPending => Status == MatchStatus.Pending;
    public bool IsAccepted => Status == MatchStatus.Accepted;
    public bool IsCancelled => Status == MatchStatus.Cancelled;
    public TimeSpan? SessionDuration => SessionDurationMinutes.HasValue
        ? TimeSpan.FromMinutes(SessionDurationMinutes.Value)
        : null;
}

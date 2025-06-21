using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace MatchmakingService.Domain.Entities;

public class Match : AuditableEntity
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

    [MaxLength(100)]
    public string OfferedSkillName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string RequestedSkillName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = MatchStatus.Pending;

    public double CompatibilityScore { get; set; } = 0.0;

    [MaxLength(500)]
    public string? MatchReason { get; set; }

    public DateTime? AcceptedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ExpiredAt { get; set; }

    [MaxLength(500)]
    public string? RejectionReason { get; set; }

    [MaxLength(1000)]
    public string? CompletionNotes { get; set; }

    public int? SessionDurationMinutes { get; set; }
    public int? RatingByOffering { get; set; }
    public int? RatingByRequesting { get; set; }

    // Helper properties
    public bool IsPending => Status == MatchStatus.Pending;
    public bool IsAccepted => Status == MatchStatus.Accepted;
    public bool IsCompleted => Status == MatchStatus.Completed;
    public bool IsRejected => Status == MatchStatus.Rejected;
    public bool IsExpired => Status == MatchStatus.Expired;
    public bool IsActive => IsPending || IsAccepted;

    public void Accept()
    {
        Status = MatchStatus.Accepted;
        AcceptedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject(string? reason = null)
    {
        Status = MatchStatus.Rejected;
        RejectionReason = reason;
        RejectedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Complete(int? sessionDuration = null, string? notes = null)
    {
        Status = MatchStatus.Completed;
        SessionDurationMinutes = sessionDuration;
        CompletionNotes = notes;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Expire()
    {
        Status = MatchStatus.Expired;
        ExpiredAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}

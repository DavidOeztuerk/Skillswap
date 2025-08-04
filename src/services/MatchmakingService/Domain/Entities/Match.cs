using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

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

    // Neue Properties für Skill-Tausch
    public bool IsSkillExchange { get; set; } = false;

    [MaxLength(450)]
    public string? ExchangeSkillId { get; set; }

    [MaxLength(100)]
    public string? ExchangeSkillName { get; set; }

    // Monetäre Details
    public bool IsMonetary { get; set; } = false;
    public decimal? AgreedAmount { get; set; }
    public string? Currency { get; set; }

    // Session-Planung
    public List<string> AgreedDays { get; set; } = new();
    public List<string> AgreedTimes { get; set; } = new();
    public int TotalSessionsPlanned { get; set; } = 1;
    public int CompletedSessions { get; set; } = 0;

    // Timeline-Tracking
    [MaxLength(450)]
    public string? OriginalRequestId { get; set; }

    [MaxLength(450)]
    public string? ThreadId { get; set; }

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
    public bool AllSessionsCompleted => CompletedSessions >= TotalSessionsPlanned;

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

    public void CompleteSession()
    {
        CompletedSessions++;
        UpdatedAt = DateTime.UtcNow;

        if (AllSessionsCompleted)
        {
            Status = MatchStatus.Completed;
            CompletedAt = DateTime.UtcNow;
        }
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
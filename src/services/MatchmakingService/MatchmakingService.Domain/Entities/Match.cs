using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace MatchmakingService.Domain.Entities;

/// <summary>
/// Match - Created when a MatchRequest is accepted
/// References the accepted MatchRequest for all details (skills, exchange, monetary, preferences)
/// Only tracks match-specific data: status, sessions, ratings
/// </summary>
public class Match : AuditableEntity
{
    /// <summary>
    /// Foreign Key to the accepted MatchRequest
    /// All match details (skills, exchange, monetary, preferences) come from this request
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string AcceptedMatchRequestId { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to the accepted MatchRequest
    /// Use this to access: SkillId, ExchangeSkillId, OfferedAmount, PreferredDays, etc.
    /// </summary>
    [ForeignKey(nameof(AcceptedMatchRequestId))]
    public virtual MatchRequest AcceptedMatchRequest { get; set; } = null!;

    // ==================== Match Status & Timeline ====================

    [MaxLength(50)]
    public string Status { get; set; } = MatchStatus.Accepted; // Starts as Accepted

    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? DissolvedAt { get; set; }

    [MaxLength(500)]
    public string? DissolutionReason { get; set; }

    // ==================== Session Tracking ====================
    // This is the ONLY data that changes during the match lifecycle

    public int CompletedSessions { get; set; } = 0;
    public DateTime? NextSessionDate { get; set; }

    // ==================== Ratings & Feedback ====================
    // Filled after match completion

    public int? RatingByOffering { get; set; }
    public int? RatingByRequesting { get; set; }

    [MaxLength(1000)]
    public string? CompletionNotes { get; set; }

    // ==================== Computed Properties ====================

    /// <summary>
    /// Gets the offering user ID from the accepted request
    /// </summary>
    [NotMapped]
    public string OfferingUserId => AcceptedMatchRequest?.TargetUserId ?? string.Empty;

    /// <summary>
    /// Gets the requesting user ID from the accepted request
    /// </summary>
    [NotMapped]
    public string RequestingUserId => AcceptedMatchRequest?.RequesterId ?? string.Empty;

    /// <summary>
    /// Gets total sessions planned from the accepted request
    /// </summary>
    [NotMapped]
    public int TotalSessionsPlanned => AcceptedMatchRequest?.TotalSessions ?? 1;

    /// <summary>
    /// Gets the skill ID from the accepted request
    /// </summary>
    [NotMapped]
    public string SkillId => AcceptedMatchRequest?.SkillId ?? string.Empty;

    // ==================== Helper Properties ====================

    public bool IsAccepted => Status == MatchStatus.Accepted;
    public bool IsCompleted => Status == MatchStatus.Completed;
    public bool IsDissolved => Status == MatchStatus.Dissolved;
    public bool IsActive => IsAccepted;
    public bool AllSessionsCompleted => CompletedSessions >= TotalSessionsPlanned;

    // ==================== Domain Methods ====================

    /// <summary>
    /// Create a new Match from an accepted MatchRequest
    /// </summary>
    public static Match CreateFromAcceptedRequest(MatchRequest acceptedRequest)
    {
        if (!acceptedRequest.IsAccepted)
        {
            throw new InvalidOperationException("Can only create match from accepted request");
        }

        return new Match
        {
            AcceptedMatchRequestId = acceptedRequest.Id,
            AcceptedMatchRequest = acceptedRequest,
            Status = MatchStatus.Accepted,
            AcceptedAt = DateTime.UtcNow,
            CompletedSessions = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
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

    public void Complete(string? notes = null)
    {
        Status = MatchStatus.Completed;
        CompletionNotes = notes;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Dissolve(string? reason = null)
    {
        Status = MatchStatus.Dissolved;
        DissolutionReason = reason;
        DissolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RateByOffering(int rating)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5", nameof(rating));

        RatingByOffering = rating;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RateByRequesting(int rating)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5", nameof(rating));

        RatingByRequesting = rating;
        UpdatedAt = DateTime.UtcNow;
    }
}

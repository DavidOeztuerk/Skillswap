using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;
using MatchmakingService.Domain.Enums;

namespace MatchmakingService.Domain.Entities;

public class MatchRequest : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string RequesterId { get; set; } = string.Empty;

    [MaxLength(450)]
    public string TargetUserId { get; set; } = string.Empty;

    [MaxLength(450)]
    public string? ThreadId { get; set; } // Gruppiert alle Anfragen zwischen zwei Usern für einen Skill

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Status of the match request (Phase 8 - converted to enum)
    /// </summary>
    public MatchRequestStatus Status { get; set; } = MatchRequestStatus.Pending;

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    // Note: Exchange settings (IsSkillExchange, ExchangeSkillId) now come from the Skill entity
    // Note: Scheduling (PreferredDays, PreferredTimes, SessionDurationMinutes, TotalSessions) now come from the Skill entity

    // Monetäre Option (optional override for payment-based matches)
    public bool IsMonetaryOffer { get; set; } = false;
    public decimal? OfferedAmount { get; set; }
    public string? Currency { get; set; } = "EUR";

    public DateTime? ExpiresAt { get; set; }
    public int ViewCount { get; set; } = 0;
    public int MatchAttempts { get; set; } = 0;

    public List<string> PreferredTags { get; set; } = [];
    public List<string> RequiredSkills { get; set; } = [];

    [MaxLength(500)]
    public string? ResponseMessage { get; set; }

    [MaxLength(2000)]
    public string? AdditionalNotes { get; set; }

    public double? CompatibilityScore { get; set; }

    public DateTime? RespondedAt { get; set; }

    // Navigation Properties
    public virtual MatchRequest? ParentRequest { get; set; }
    public virtual ICollection<MatchRequest> CounterOffers { get; set; } = [];

    // Helper properties (Phase 8 - updated for enum)
    public bool IsPending => Status == MatchRequestStatus.Pending;
    public bool IsAccepted => Status == MatchRequestStatus.Accepted;
    public bool IsRejected => Status == MatchRequestStatus.Rejected;
    public bool IsExpired => Status == MatchRequestStatus.Expired;
    public bool IsCounterOffered => Status == MatchRequestStatus.CounterOffered;

    public void Accept(string? responseMessage = null)
    {
        Status = MatchRequestStatus.Accepted;
        ResponseMessage = responseMessage;
        RespondedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject(string? responseMessage = null)
    {
        Status = MatchRequestStatus.Rejected;
        ResponseMessage = responseMessage;
        RespondedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsCounterOffered()
    {
        Status = MatchRequestStatus.CounterOffered;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Expire()
    {
        Status = MatchRequestStatus.Expired;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViewCount() => ViewCount++;
    public void IncrementMatchAttempts() => MatchAttempts++;
}
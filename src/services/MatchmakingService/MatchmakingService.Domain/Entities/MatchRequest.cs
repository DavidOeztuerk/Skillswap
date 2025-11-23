using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

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

    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    // Tausch-Funktionalität
    public bool IsSkillExchange { get; set; } = false;

    [MaxLength(450)]
    public string? ExchangeSkillId { get; set; }

    // Monetäre Option
    public bool IsMonetaryOffer { get; set; } = false;
    public decimal? OfferedAmount { get; set; }
    public string? Currency { get; set; } = "EUR";

    // Zeitplanung
    public List<string> PreferredDays { get; set; } = [];
    public List<string> PreferredTimes { get; set; } = [];
    public int? SessionDurationMinutes { get; set; }
    public int? TotalSessions { get; set; } = 1;

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

    // Helper properties
    public bool IsPending => Status.ToLower() == "pending";
    public bool IsAccepted => Status.ToLower() == "accepted";
    public bool IsRejected => Status.ToLower() == "rejected";
    public bool IsExpired => Status.ToLower() == "expired";
    public bool IsCounterOffered => Status.ToLower() == "counteroffered";

    public void Accept(string? responseMessage = null)
    {
        Status = "Accepted";
        ResponseMessage = responseMessage;
        RespondedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject(string? responseMessage = null)
    {
        Status = "Rejected";
        ResponseMessage = responseMessage;
        RespondedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsCounterOffered()
    {
        Status = "CounterOffered";
        UpdatedAt = DateTime.UtcNow;
    }

    public void Expire()
    {
        Status = "Expired";
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViewCount() => ViewCount++;
    public void IncrementMatchAttempts() => MatchAttempts++;
}
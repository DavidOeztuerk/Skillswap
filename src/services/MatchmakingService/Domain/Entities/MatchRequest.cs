using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace MatchmakingService.Domain.Entities;

public class MatchRequest : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string RequesterId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }

    public int ViewCount { get; set; } = 0;
    public int MatchAttempts { get; set; } = 0;

    public List<string> PreferredTags { get; set; } = new();
    public List<string> RequiredSkills { get; set; } = new();

    [MaxLength(500)]
    public string? ResponseMessage { get; set; }

    public DateTime? RespondedAt { get; set; }

    // Helper properties
    public bool IsPending => Status == "Pending";
    public bool IsAccepted => Status == "Accepted";
    public bool IsRejected => Status == "Rejected";
    public bool IsExpired => Status == "Expired";

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

    public void Expire()
    {
        Status = "Expired";
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViewCount() => ViewCount++;
    public void IncrementMatchAttempts() => MatchAttempts++;
}
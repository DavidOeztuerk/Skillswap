using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace MatchmakingService.Domain.Entities;

public class MatchRequest : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string SkillName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsOffering { get; set; } = false;

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public List<string> PreferredTags { get; set; } = new();
    public List<string> RequiredSkills { get; set; } = new();

    [MaxLength(200)]
    public string? PreferredLocation { get; set; }

    public bool RemoteOnly { get; set; } = false;

    public int? MaxDistanceKm { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public int ViewCount { get; set; } = 0;
    public int MatchAttempts { get; set; } = 0;

    public void IncrementViewCount() => ViewCount++;
    public void IncrementMatchAttempts() => MatchAttempts++;
}
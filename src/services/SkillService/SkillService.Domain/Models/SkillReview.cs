using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Skill reviews and ratings
/// </summary>
public class SkillReview : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string ReviewerUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string ReviewedUserId { get; set; } = string.Empty; // Owner of the skill

    [Required]
    public int Rating { get; set; } // 1-5 stars

    [MaxLength(1000)]
    public string? Comment { get; set; }

    // Review tags (JSON array)
    public string? TagsJson { get; set; }

    // Helpful votes
    public int HelpfulVotes { get; set; } = 0;
    public int TotalVotes { get; set; } = 0;

    // Review context
    [MaxLength(50)]
    public string? ReviewContext { get; set; } // "after_session", "endorsement", etc.

    public bool IsVerified { get; set; } = false; // Verified purchase/session

    public bool IsVisible { get; set; } = true;

    // Navigation properties
    public virtual Skill Skill { get; set; } = null!;

    // Helper properties
    public List<string> Tags
    {
        get => string.IsNullOrEmpty(TagsJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(TagsJson) ?? new List<string>();
        set => TagsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    public double HelpfulnessRatio => TotalVotes > 0 ? (double)HelpfulVotes / TotalVotes : 0;
    public bool IsHighRating => Rating >= 4;
    public bool IsRecentReview => CreatedAt >= DateTime.UtcNow.AddDays(-30);
}

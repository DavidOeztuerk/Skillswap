using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Enhanced Skill entity with comprehensive features
/// </summary>
public class Skill : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string SkillCategoryId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string ProficiencyLevelId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public bool IsOffered { get; set; } = true; // true = offering, false = seeking

    // Enhanced properties
    [MaxLength(1000)]
    public string? Requirements { get; set; }

    public bool IsRemoteAvailable { get; set; } = true;

    public int? EstimatedDurationMinutes { get; set; }

    // Tags stored as JSON array
    public string? TagsJson { get; set; }

    // Rating and review aggregates
    public double? AverageRating { get; set; }
    public int ReviewCount { get; set; } = 0;
    public int EndorsementCount { get; set; } = 0;

    // Activity tracking
    public int ViewCount { get; set; } = 0;
    public int MatchCount { get; set; } = 0;
    public DateTime? LastViewedAt { get; set; }
    public DateTime? LastMatchedAt { get; set; }

    // Status and visibility
    public bool IsActive { get; set; } = true;
    public bool IsVerified { get; set; } = false;

    // SEO and searchability
    [MaxLength(500)]
    public string? SearchKeywords { get; set; }

    public double SearchRelevanceScore { get; set; } = 1.0;

    // Navigation properties
    public virtual SkillCategory SkillCategory { get; set; } = null!;
    public virtual ProficiencyLevel ProficiencyLevel { get; set; } = null!;
    public virtual ICollection<SkillReview> Reviews { get; set; } = new List<SkillReview>();
    public virtual ICollection<SkillEndorsement> Endorsements { get; set; } = new List<SkillEndorsement>();
    public virtual ICollection<SkillView> Views { get; set; } = new List<SkillView>();
    public virtual ICollection<SkillMatch> Matches { get; set; } = new List<SkillMatch>();

    // Helper properties
    public List<string> Tags
    {
        get => string.IsNullOrEmpty(TagsJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(TagsJson) ?? new List<string>();
        set => TagsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    public bool IsHighlyRated => AverageRating >= 4.5;
    public bool IsPopular => ViewCount > 100 || MatchCount > 10;
    public bool IsRecent => CreatedAt >= DateTime.UtcNow.AddDays(-30);

    // Business methods
    public void AddView(string? viewerUserId, string? ipAddress = null)
    {
        ViewCount++;
        LastViewedAt = DateTime.UtcNow;

        Views.Add(new SkillView
        {
            SkillId = Id,
            ViewerUserId = viewerUserId,
            IpAddress = ipAddress,
            ViewedAt = DateTime.UtcNow
        });
    }

    public void UpdateRating(double newAverageRating, int newReviewCount)
    {
        AverageRating = newAverageRating;
        ReviewCount = newReviewCount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementEndorsements()
    {
        EndorsementCount++;
        UpdatedAt = DateTime.UtcNow;
    }
}

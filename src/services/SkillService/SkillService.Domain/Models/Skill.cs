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
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public bool IsOffered { get; set; } = true; // true = offering, false = seeking

    // =============================================
    // Exchange Options (optional, default: skill_exchange)
    // =============================================

    /// <summary>
    /// Type of exchange: skill_exchange (default) or payment
    /// Note: "free" is only for Public Workshops (separate epic)
    /// </summary>
    [MaxLength(20)]
    public string ExchangeType { get; set; } = "skill_exchange";

    /// <summary>
    /// For skill_exchange: Category of desired skill in return
    /// </summary>
    [MaxLength(450)]
    public string? DesiredSkillCategoryId { get; set; }

    /// <summary>
    /// For skill_exchange: Description of what skill is desired
    /// </summary>
    [MaxLength(500)]
    public string? DesiredSkillDescription { get; set; }

    /// <summary>
    /// For payment: Hourly rate (only valid when IsOffered=true)
    /// </summary>
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// For payment: Currency code (EUR, USD, CHF, GBP)
    /// </summary>
    [MaxLength(3)]
    public string? Currency { get; set; }

    // =============================================
    // Scheduling (required for matching)
    // =============================================

    /// <summary>
    /// Preferred days for sessions (JSON array: ["monday", "tuesday", ...])
    /// </summary>
    public string? PreferredDaysJson { get; set; }

    /// <summary>
    /// Preferred times for sessions (JSON array: ["morning", "afternoon", "evening"])
    /// </summary>
    public string? PreferredTimesJson { get; set; }

    /// <summary>
    /// Duration of each session in minutes (15, 30, 45, 60, 90, 120)
    /// </summary>
    public int SessionDurationMinutes { get; set; } = 60;

    /// <summary>
    /// Total number of sessions needed to teach/learn this skill
    /// </summary>
    public int TotalSessions { get; set; } = 1;

    // =============================================
    // Location (optional, default: remote)
    // =============================================

    /// <summary>
    /// Location type: remote (default), in_person, or both
    /// </summary>
    [MaxLength(20)]
    public string LocationType { get; set; } = "remote";

    /// <summary>
    /// For in_person: Street address
    /// </summary>
    [MaxLength(200)]
    public string? LocationAddress { get; set; }

    /// <summary>
    /// For in_person: City name
    /// </summary>
    [MaxLength(100)]
    public string? LocationCity { get; set; }

    /// <summary>
    /// For in_person: Postal code (required for distance calculation)
    /// </summary>
    [MaxLength(20)]
    public string? LocationPostalCode { get; set; }

    /// <summary>
    /// For in_person: Country code (ISO 3166-1 alpha-2, e.g., "DE")
    /// </summary>
    [MaxLength(2)]
    public string? LocationCountry { get; set; }

    /// <summary>
    /// Maximum distance in km for in_person matching (default: 50)
    /// </summary>
    public int MaxDistanceKm { get; set; } = 50;

    /// <summary>
    /// Geocoded latitude (cached from Nominatim on skill creation)
    /// </summary>
    public double? LocationLatitude { get; set; }

    /// <summary>
    /// Geocoded longitude (cached from Nominatim on skill creation)
    /// </summary>
    public double? LocationLongitude { get; set; }

    // Enhanced properties
    [MaxLength(1000)]
    public string? Requirements { get; set; }

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

    public List<string> PreferredDays
    {
        get => string.IsNullOrEmpty(PreferredDaysJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(PreferredDaysJson) ?? new List<string>();
        set => PreferredDaysJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    public List<string> PreferredTimes
    {
        get => string.IsNullOrEmpty(PreferredTimesJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(PreferredTimesJson) ?? new List<string>();
        set => PreferredTimesJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    // Exchange type helpers
    public bool IsSkillExchange => ExchangeType == "skill_exchange";
    public bool IsPayment => ExchangeType == "payment";

    // Location helpers
    public bool IsRemote => LocationType == "remote";
    public bool IsInPerson => LocationType == "in_person";
    public bool IsBothLocations => LocationType == "both";
    public bool HasGeoLocation => LocationLatitude.HasValue && LocationLongitude.HasValue;

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

using Domain.Abstractions;
using SkillService.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkillService.Domain.Entities;

/// <summary>
/// Enhanced Skill entity with comprehensive features.
/// Properties are organized into Value Objects for better maintainability:
/// - ExchangeDetails: Exchange type, payment, desired skills
/// - Scheduling: Session duration, total sessions, preferred times
/// - Location: Address, coordinates, distance settings
/// - Metrics: Views, matches, ratings (computed/cached)
/// </summary>
public class Skill : AuditableEntity
{
  // =============================================
  // Core Properties (required)
  // =============================================

  [Required]
  [MaxLength(450)]
  public string UserId { get; set; } = string.Empty;

  /// <summary>
  /// Category → Subcategory → Topic → Skill
  /// </summary>
  [Required]
  [MaxLength(450)]
  public string SkillTopicId { get; set; } = string.Empty;

  [Required]
  [MaxLength(100)]
  public string Name { get; set; } = string.Empty;

  [Required]
  [MaxLength(2000)]
  public string Description { get; set; } = string.Empty;

  /// <summary>
  /// true = offering to teach, false = seeking to learn
  /// </summary>
  public bool IsOffered { get; set; } = true;

  /// <summary>
  /// Whether the skill is active and visible
  /// </summary>
  public bool IsActive { get; set; } = true;

  /// <summary>
  /// Whether the skill has been verified by moderators
  /// </summary>
  public bool IsVerified { get; set; } = false;

  // =============================================
  // Additional Properties
  // =============================================

  /// <summary>
  /// Tags stored as JSON array
  /// </summary>
  public string? TagsJson { get; set; }

  /// <summary>
  /// Requirements or prerequisites for learning this skill
  /// </summary>
  [MaxLength(1000)]
  public string? Requirements { get; set; }

  /// <summary>
  /// Estimated total duration to learn this skill
  /// </summary>
  public int? EstimatedDurationMinutes { get; set; }

  /// <summary>
  /// SEO keywords for searchability
  /// </summary>
  [MaxLength(500)]
  public string? SearchKeywords { get; set; }

  /// <summary>
  /// Search relevance score for ranking
  /// </summary>
  public double SearchRelevanceScore { get; set; } = 1.0;

  // =============================================
  // Exchange Properties (mapped from ExchangeDetails)
  // =============================================

  [MaxLength(20)]
  public string ExchangeType { get; set; } = "skill_exchange";

  [MaxLength(450)]
  public string? DesiredSkillTopicId { get; set; }

  [MaxLength(500)]
  public string? DesiredSkillDescription { get; set; }

  public decimal? HourlyRate { get; set; }

  [MaxLength(3)]
  public string? Currency { get; set; }

  // =============================================
  // Scheduling Properties (mapped from Scheduling)
  // =============================================

  public string? PreferredDaysJson { get; set; }
  public string? PreferredTimesJson { get; set; }
  public int SessionDurationMinutes { get; set; } = 60;
  public int TotalSessions { get; set; } = 1;

  // =============================================
  // Location Properties (mapped from Location)
  // =============================================

  [MaxLength(20)]
  public string LocationType { get; set; } = "remote";

  [MaxLength(200)]
  public string? LocationAddress { get; set; }

  [MaxLength(100)]
  public string? LocationCity { get; set; }

  [MaxLength(20)]
  public string? LocationPostalCode { get; set; }

  [MaxLength(2)]
  public string? LocationCountry { get; set; }

  public int MaxDistanceKm { get; set; } = 50;

  public double? LocationLatitude { get; set; }
  public double? LocationLongitude { get; set; }

  // =============================================
  // Metrics Properties (mapped from Metrics)
  // =============================================

  public double? AverageRating { get; set; }
  public int ReviewCount { get; set; } = 0;
  public int EndorsementCount { get; set; } = 0;
  public int ViewCount { get; set; } = 0;
  public int MatchCount { get; set; } = 0;
  public DateTime? LastViewedAt { get; set; }
  public DateTime? LastMatchedAt { get; set; }

  // =============================================
  // Navigation Properties
  // =============================================

  /// <summary>
  /// Access Subcategory via Topic.Subcategory, Category via Topic.Subcategory.Category
  /// </summary>
  public virtual SkillTopic Topic { get; set; } = null!;

  public virtual ICollection<SkillReview> Reviews { get; set; } = new List<SkillReview>();
  public virtual ICollection<SkillEndorsement> Endorsements { get; set; } = new List<SkillEndorsement>();
  public virtual ICollection<SkillView> Views { get; set; } = new List<SkillView>();
  public virtual ICollection<SkillMatch> Matches { get; set; } = new List<SkillMatch>();

  // Junction table navigation (Phase 3 - replacing JSON fields)
  public virtual ICollection<SkillPreferredDay> PreferredDayEntities { get; set; } = new List<SkillPreferredDay>();
  public virtual ICollection<SkillPreferredTime> PreferredTimeEntities { get; set; } = new List<SkillPreferredTime>();
  public virtual ICollection<SkillTag> TagEntities { get; set; } = new List<SkillTag>();

  /// <summary>
  /// A skill has one active listing at a time
  /// </summary>
  public virtual Listing? Listing { get; set; }

  [NotMapped]
  public SkillSubcategory? Subcategory => Topic?.Subcategory;

  [NotMapped]
  public SkillCategory? Category => Topic?.Subcategory?.Category;

  [NotMapped]
  public string? CategoryName => Category?.Name;

  [NotMapped]
  public string? SubcategoryName => Subcategory?.Name;

  [NotMapped]
  public string? TopicName => Topic?.Name;

  // =============================================
  // Value Object Accessors (for clean code organization)
  // =============================================

  /// <summary>
  /// Get exchange details as value object (read-only view)
  /// </summary>
  [NotMapped]
  public SkillExchangeDetails ExchangeDetails => GetExchangeDetails();

  /// <summary>
  /// Get scheduling as value object (read-only view)
  /// </summary>
  [NotMapped]
  public SkillScheduling Scheduling => GetScheduling();

  /// <summary>
  /// Get location as value object (read-only view)
  /// </summary>
  [NotMapped]
  public SkillLocation Location => GetLocation();

  /// <summary>
  /// Get metrics as value object (read-only view)
  /// </summary>
  [NotMapped]
  public SkillEngagementMetrics Metrics => GetMetrics();

  // =============================================
  // Helper Properties
  // =============================================

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

  // Metrics helpers
  public bool IsHighlyRated => AverageRating >= 4.5;
  public bool IsPopular => ViewCount > 100 || MatchCount > 10;
  public bool IsRecent => CreatedAt >= DateTime.UtcNow.AddDays(-30);

  // =============================================
  // Factory Methods
  // =============================================

  public static Skill Create(
      string userId,
      string skillTopicId,
      string name,
      string description,
      bool isOffered = true,
      List<string>? tags = null)
  {
    return new Skill
    {
      Id = Guid.NewGuid().ToString(),
      UserId = userId,
      SkillTopicId = skillTopicId,
      Name = name,
      Description = description,
      IsOffered = isOffered,
      TagsJson = tags != null ? System.Text.Json.JsonSerializer.Serialize(tags) : null,
      CreatedAt = DateTime.UtcNow
    };
  }

  // =============================================
  // Value Object Builders (internal)
  // =============================================

  private SkillExchangeDetails GetExchangeDetails()
  {
    if (ExchangeType == "payment")
    {
      return SkillExchangeDetails.CreatePayment(HourlyRate ?? 0, Currency ?? "EUR");
    }
    return SkillExchangeDetails.CreateSkillExchange(DesiredSkillTopicId, DesiredSkillDescription);
  }

  private SkillScheduling GetScheduling()
  {
    return SkillScheduling.Create(PreferredDays, PreferredTimes, SessionDurationMinutes, TotalSessions);
  }

  private SkillLocation GetLocation()
  {
    return LocationType switch
    {
      "in_person" => SkillLocation.CreateInPerson(LocationAddress, LocationCity, LocationPostalCode, LocationCountry, MaxDistanceKm, LocationLatitude, LocationLongitude),
      "both" => SkillLocation.CreateBoth(LocationAddress, LocationCity, LocationPostalCode, LocationCountry, MaxDistanceKm, LocationLatitude, LocationLongitude),
      _ => SkillLocation.CreateRemote()
    };
  }

  private SkillEngagementMetrics GetMetrics()
  {
    var metrics = SkillEngagementMetrics.Create();
    // Note: We can't set private properties, so this returns a fresh metrics object
    // The actual values are stored directly on Skill entity
    return metrics;
  }

  // =============================================
  // Update Methods (using Value Objects)
  // =============================================

  public void UpdateExchangeDetails(SkillExchangeDetails details)
  {
    ExchangeType = details.ExchangeType;
    DesiredSkillTopicId = details.DesiredSkillTopicId;
    DesiredSkillDescription = details.DesiredSkillDescription;
    HourlyRate = details.HourlyRate;
    Currency = details.Currency;
    UpdatedAt = DateTime.UtcNow;
  }

  public void UpdateScheduling(SkillScheduling scheduling)
  {
    PreferredDaysJson = scheduling.PreferredDaysJson;
    PreferredTimesJson = scheduling.PreferredTimesJson;
    SessionDurationMinutes = scheduling.SessionDurationMinutes;
    TotalSessions = scheduling.TotalSessions;
    UpdatedAt = DateTime.UtcNow;
  }

  public void UpdateLocation(SkillLocation location)
  {
    LocationType = location.LocationType;
    LocationAddress = location.Address;
    LocationCity = location.City;
    LocationPostalCode = location.PostalCode;
    LocationCountry = location.Country;
    MaxDistanceKm = location.MaxDistanceKm;
    LocationLatitude = location.Latitude;
    LocationLongitude = location.Longitude;
    UpdatedAt = DateTime.UtcNow;
  }

  // =============================================
  // Business Methods
  // =============================================

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

  public void RecordMatch()
  {
    MatchCount++;
    LastMatchedAt = DateTime.UtcNow;
    UpdatedAt = DateTime.UtcNow;
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

  public void Activate()
  {
    IsActive = true;
    UpdatedAt = DateTime.UtcNow;
  }

  public void Deactivate()
  {
    IsActive = false;
    UpdatedAt = DateTime.UtcNow;
  }

  public void Verify()
  {
    IsVerified = true;
    UpdatedAt = DateTime.UtcNow;
  }

  public void UpdateBasicInfo(string name, string description, string skillTopicId, List<string>? tags = null)
  {
    Name = name;
    Description = description;
    SkillTopicId = skillTopicId;
    if (tags != null)
    {
      Tags = tags;
    }
    UpdatedAt = DateTime.UtcNow;
  }
}

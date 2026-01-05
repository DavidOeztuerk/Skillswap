namespace Events.Integration.SkillManagement;

/// <summary>
/// Integration event published when a new skill is created.
/// Contains all data needed for automatic matchmaking.
/// </summary>
public record SkillCreatedEvent
{
    // ==========================================================================
    // BASIC SKILL INFO
    // ==========================================================================

    public string SkillId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string CategoryId { get; init; } = string.Empty;
    public string CategoryName { get; init; } = string.Empty;
    public string ProficiencyLevelId { get; init; } = string.Empty;
    public int ProficiencyLevelRank { get; init; }
    public bool IsOffered { get; init; }

    // ==========================================================================
    // EXCHANGE OPTIONS
    // ==========================================================================

    /// <summary>
    /// Exchange type: 'skill_exchange' or 'payment'
    /// </summary>
    public string ExchangeType { get; init; } = "skill_exchange";

    /// <summary>
    /// For skill_exchange: Desired skill category
    /// </summary>
    public string? DesiredSkillCategoryId { get; init; }

    /// <summary>
    /// For skill_exchange: Description of desired skill
    /// </summary>
    public string? DesiredSkillDescription { get; init; }

    /// <summary>
    /// For payment: Hourly rate
    /// </summary>
    public decimal? HourlyRate { get; init; }

    /// <summary>
    /// For payment: Currency code
    /// </summary>
    public string? Currency { get; init; }

    // ==========================================================================
    // SCHEDULING
    // ==========================================================================

    public string[] PreferredDays { get; init; } = [];
    public string[] PreferredTimes { get; init; } = [];
    public int SessionDurationMinutes { get; init; } = 60;
    public int TotalSessions { get; init; } = 1;

    // ==========================================================================
    // LOCATION
    // ==========================================================================

    /// <summary>
    /// Location type: 'remote', 'in_person', or 'both'
    /// </summary>
    public string LocationType { get; init; } = "remote";

    public string? LocationCity { get; init; }
    public string? LocationPostalCode { get; init; }
    public string? LocationCountry { get; init; }
    public int MaxDistanceKm { get; init; } = 50;

    /// <summary>
    /// Pre-geocoded latitude for distance calculations
    /// </summary>
    public double? LocationLatitude { get; init; }

    /// <summary>
    /// Pre-geocoded longitude for distance calculations
    /// </summary>
    public double? LocationLongitude { get; init; }

    // ==========================================================================
    // METADATA
    // ==========================================================================

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

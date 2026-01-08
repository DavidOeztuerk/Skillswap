namespace SkillService.Domain.ValueObjects;

/// <summary>
/// Value Object for skill engagement metrics.
/// These are computed/aggregated values that are denormalized for performance.
/// Stored as owned entity in Skill table.
/// </summary>
public class SkillEngagementMetrics
{
    /// <summary>
    /// Average rating from reviews (0-5)
    /// </summary>
    public double? AverageRating { get; private set; }

    /// <summary>
    /// Total number of reviews
    /// </summary>
    public int ReviewCount { get; private set; } = 0;

    /// <summary>
    /// Total number of endorsements
    /// </summary>
    public int EndorsementCount { get; private set; } = 0;

    /// <summary>
    /// Total number of views
    /// </summary>
    public int ViewCount { get; private set; } = 0;

    /// <summary>
    /// Total number of matches
    /// </summary>
    public int MatchCount { get; private set; } = 0;

    /// <summary>
    /// Last time the skill was viewed
    /// </summary>
    public DateTime? LastViewedAt { get; private set; }

    /// <summary>
    /// Last time the skill was matched
    /// </summary>
    public DateTime? LastMatchedAt { get; private set; }

    // Required for EF Core
    private SkillEngagementMetrics() { }

    public static SkillEngagementMetrics Create()
    {
        return new SkillEngagementMetrics();
    }

    public static SkillEngagementMetrics Default() => Create();

    // Helper properties
    public bool IsHighlyRated => AverageRating >= 4.5;
    public bool IsPopular => ViewCount > 100 || MatchCount > 10;

    // Update methods
    public void RecordView()
    {
        ViewCount++;
        LastViewedAt = DateTime.UtcNow;
    }

    public void RecordMatch()
    {
        MatchCount++;
        LastMatchedAt = DateTime.UtcNow;
    }

    public void UpdateRating(double newAverageRating, int newReviewCount)
    {
        AverageRating = newAverageRating;
        ReviewCount = newReviewCount;
    }

    public void IncrementEndorsements()
    {
        EndorsementCount++;
    }

    public void DecrementEndorsements()
    {
        if (EndorsementCount > 0)
            EndorsementCount--;
    }
}

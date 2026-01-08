namespace Contracts.User.Responses;

/// <summary>
/// Individual profile completeness item
/// Phase 13: Profile Completeness
/// </summary>
public record ProfileCompletenessItem
{
    /// <summary>
    /// Unique key for this completeness item
    /// </summary>
    public required string Key { get; init; }

    /// <summary>
    /// Display label for the item (localized)
    /// </summary>
    public required string Label { get; init; }

    /// <summary>
    /// Whether this item is completed
    /// </summary>
    public required bool IsCompleted { get; init; }

    /// <summary>
    /// Weight/percentage this item contributes to total completeness
    /// </summary>
    public required int Weight { get; init; }

    /// <summary>
    /// Actual points earned (0 if not completed, Weight if completed)
    /// </summary>
    public int Points => IsCompleted ? Weight : 0;

    /// <summary>
    /// Optional hint for completing this item
    /// </summary>
    public string? Hint { get; init; }

    /// <summary>
    /// Optional action URL to complete this item
    /// </summary>
    public string? ActionUrl { get; init; }

    /// <summary>
    /// Icon name for this item (for frontend display)
    /// </summary>
    public string? Icon { get; init; }
}

/// <summary>
/// Profile completeness response
/// Phase 13: Profile Completeness
/// </summary>
public record ProfileCompletenessResponse
{
    /// <summary>
    /// User ID
    /// </summary>
    public required Guid UserId { get; init; }

    /// <summary>
    /// Overall completeness percentage (0-100)
    /// </summary>
    public required int Percentage { get; init; }

    /// <summary>
    /// Total possible points
    /// </summary>
    public required int TotalPoints { get; init; }

    /// <summary>
    /// Points earned
    /// </summary>
    public required int EarnedPoints { get; init; }

    /// <summary>
    /// Number of completed items
    /// </summary>
    public required int CompletedCount { get; init; }

    /// <summary>
    /// Total number of items
    /// </summary>
    public required int TotalCount { get; init; }

    /// <summary>
    /// Profile completeness level
    /// </summary>
    public required ProfileCompletenessLevel Level { get; init; }

    /// <summary>
    /// Individual completeness items
    /// </summary>
    public required List<ProfileCompletenessItem> Items { get; init; }

    /// <summary>
    /// Suggested next actions to improve profile
    /// </summary>
    public List<ProfileCompletenessItem> SuggestedActions =>
        Items.Where(i => !i.IsCompleted).OrderByDescending(i => i.Weight).Take(3).ToList();

    /// <summary>
    /// When this was calculated
    /// </summary>
    public DateTime CalculatedAt { get; init; } = DateTime.UtcNow;
}

/// <summary>
/// Profile completeness level enum
/// </summary>
public enum ProfileCompletenessLevel
{
    /// <summary>
    /// 0-24% - Profile needs attention
    /// </summary>
    Beginner = 0,

    /// <summary>
    /// 25-49% - Profile is getting started
    /// </summary>
    Basic = 1,

    /// <summary>
    /// 50-74% - Profile is good
    /// </summary>
    Intermediate = 2,

    /// <summary>
    /// 75-89% - Profile is very good
    /// </summary>
    Advanced = 3,

    /// <summary>
    /// 90-100% - Profile is complete
    /// </summary>
    Expert = 4
}

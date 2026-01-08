namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserStatistics operation (Phase 5 - Extended)
/// </summary>
public record GetUserStatisticsResponse(
    // Experience statistics
    int TotalExperienceMonths,
    int TotalExperienceYears,
    int ExperienceCount,
    string? PrimaryJobTitle,
    string? PrimaryIndustry,

    // Skill statistics
    int SkillsOffered,
    int SkillsWanted,
    int TotalEndorsementsReceived,

    // Match & Session statistics
    int MatchesCompleted,
    int SessionsCompleted,
    decimal TotalSessionHours,

    // Review statistics
    double? AverageRating,
    int ReviewsReceived,
    int ReviewsGiven,

    // Activity statistics
    DateTime MemberSince,
    DateTime? LastActiveAt,
    int ProfileViews)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Compact version for skill search results (Phase 5)
/// </summary>
public record UserExperienceSummaryResponse(
    string UserId,
    int TotalExperienceMonths,
    int TotalExperienceYears,
    string? PrimaryJobTitle,
    double? AverageRating);


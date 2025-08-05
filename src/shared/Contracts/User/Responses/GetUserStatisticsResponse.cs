namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserStatistics operation
/// </summary>
public record GetUserStatisticsResponse(
    int SkillsOffered,
    int SkillsLearned,
    int MatchesCompleted,
    double AverageRating,
    int EndorsementsReceived,
    DateTime MemberSince)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

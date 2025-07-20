namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetMatchDetails operation
/// </summary>
public record GetMatchDetailsResponse(
    string MatchId,
    string OfferedSkillId,
    string OfferedSkillName,
    string RequestedSkillId,
    string RequestedSkillName,
    string OfferingUserId,
    string OfferingUserName,
    string RequestingUserId,
    string RequestingUserName,
    double CompatibilityScore,
    string Status,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt,
    string? MeetingType,
    string? MeetingLocation,
    List<string> SharedInterests,
    MatchStatistics Statistics)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record MatchStatistics(
    int TotalSessions,
    double AverageRating,
    int SuccessfulCompletions,
    double ResponseTimeHours);
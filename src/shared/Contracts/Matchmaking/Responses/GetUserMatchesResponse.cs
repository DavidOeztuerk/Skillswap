namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetUserMatches operation
/// </summary>
public record GetUserMatchesResponse(
    List<UserMatchItem> Matches,
    int TotalCount,
    int PageNumber,
    int PageSize,
    bool HasNextPage,
    bool HasPreviousPage)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record UserMatchItem(
    string MatchId,
    string SkillName,
    string OtherUserId,
    string OtherUserName,
    string MatchType, // "Offering" or "Requesting"
    string Status,
    double CompatibilityScore,
    DateTime CreatedAt,
    DateTime? NextSessionDate);

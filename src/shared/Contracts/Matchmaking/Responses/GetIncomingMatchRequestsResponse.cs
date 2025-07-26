namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetIncomingMatchRequests operation
/// </summary>
public record GetIncomingMatchRequestsResponse(
    List<MatchRequestItem> Requests,
    int TotalCount,
    int PageNumber,
    int PageSize)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record MatchRequestItem(
    string RequestId,
    string FromUserId,
    string SkillId,
    string Description,
    string Status,
    DateTime CreatedAt);

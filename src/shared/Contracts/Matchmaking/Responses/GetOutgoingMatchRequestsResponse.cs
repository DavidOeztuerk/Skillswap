namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetOutgoingMatchRequests operation
/// </summary>
public record GetOutgoingMatchRequestsResponse(
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

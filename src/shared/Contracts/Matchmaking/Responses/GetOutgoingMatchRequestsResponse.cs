namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetOutgoingMatchRequests operation
/// </summary>
public record GetOutgoingMatchRequestsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

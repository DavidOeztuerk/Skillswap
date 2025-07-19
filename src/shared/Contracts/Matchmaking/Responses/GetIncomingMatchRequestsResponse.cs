namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetIncomingMatchRequests operation
/// </summary>
public record GetIncomingMatchRequestsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

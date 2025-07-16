namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for RejectMatchRequest operation
/// </summary>
public record RejectMatchRequestResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

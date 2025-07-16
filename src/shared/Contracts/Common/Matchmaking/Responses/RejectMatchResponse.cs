namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for RejectMatch operation
/// </summary>
public record RejectMatchResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for AcceptMatch operation
/// </summary>
public record AcceptMatchResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

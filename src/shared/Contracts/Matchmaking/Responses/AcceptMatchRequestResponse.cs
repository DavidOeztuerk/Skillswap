namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for AcceptMatchRequest operation
/// </summary>
public record AcceptMatchRequestResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

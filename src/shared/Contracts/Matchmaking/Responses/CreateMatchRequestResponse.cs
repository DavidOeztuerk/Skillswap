namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for CreateMatchRequest operation
/// </summary>
public record CreateMatchRequestResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

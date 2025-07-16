namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for CompleteMatch operation
/// </summary>
public record CompleteMatchResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

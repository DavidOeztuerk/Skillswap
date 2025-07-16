namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetMatchDetails operation
/// </summary>
public record GetMatchDetailsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

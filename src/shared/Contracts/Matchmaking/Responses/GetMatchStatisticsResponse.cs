namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for GetMatchStatistics operation
/// </summary>
public record GetMatchStatisticsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

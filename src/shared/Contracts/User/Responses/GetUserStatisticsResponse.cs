namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserStatistics operation
/// </summary>
public record GetUserStatisticsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

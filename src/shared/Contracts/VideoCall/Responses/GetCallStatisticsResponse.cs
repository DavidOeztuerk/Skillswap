namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetCallStatistics operation
/// </summary>
public record GetCallStatisticsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
